import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { generateQRToken } from '@/lib/utils'
import { cookies } from 'next/headers'
import { rateLimit, rateLimits } from '@/lib/rate-limit'
import { TIER_LIMITS } from '@/lib/stripe'

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        date: z.string().transform(s => new Date(s)),
        privacy: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC'),
        qrExpirationDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const limit = rateLimit(`event:create:${ctx.userId}`, rateLimits.createEvent)
      if (!limit.success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many events created. Please try again later.' })
      }
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
      })

      const tier = user?.subscriptionTier ?? 'FREE'

      // Count user's events this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const eventCount = await ctx.prisma.event.count({
        where: {
          ownerId: ctx.userId,
          createdAt: { gte: startOfMonth },
        },
      })

      const MAX_EVENTS = tier === 'FREE' ? 3 : Infinity
      if (eventCount >= MAX_EVENTS) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You have reached your monthly event limit (${MAX_EVENTS}). Upgrade to Pro for unlimited events.`,
        })
      }

      const qrToken = generateQRToken()
      const qrExpiresAt = input.qrExpirationDays
        ? new Date(Date.now() + input.qrExpirationDays * 24 * 60 * 60 * 1000)
        : null

      // Beta: all events auto-delete after 7 days
      const autoDeleteAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      return ctx.prisma.event.create({
        data: {
          name: input.name,
          description: input.description,
          date: input.date,
          privacy: input.privacy,
          qrToken,
          qrExpiresAt,
          autoDeleteAt,
          ownerId: ctx.userId,
        },
      })
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const events = await ctx.prisma.event.findMany({
      where: {
        OR: [
          { ownerId: ctx.userId },
          { collaborators: { some: { id: ctx.userId } } },
        ],
      },
      include: {
        _count: { select: { photos: true } },
        photos: {
          select: { size: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return events.map((e) => ({
      ...e,
      _count: e._count,
    }))
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
        include: {
          owner: { select: { id: true, name: true, image: true } },
          collaborators: { select: { id: true, name: true, image: true } },
          _count: { select: { photos: true } },
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      // Privacy check — private/invite-only events require access
      if (event.privacy !== 'PUBLIC') {
        const userId = ctx.session?.user?.id
        if (!userId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'This event is private' })
        }
        const isOwner = event.ownerId === userId
        const isCollaborator = event.collaborators.some((c: { id: string }) => c.id === userId)
        if (!isOwner && !isCollaborator) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this event' })
        }
      }

      // Check QR expiration
      if (event.qrExpiresAt && event.qrExpiresAt < new Date()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'QR code has expired' })
      }

      // Increment views with deduplication (24h cookie)
      const cookieStore = await cookies()
      const viewsCookie = cookieStore.get('eventshare_views')?.value
      const views: Record<string, number> = viewsCookie ? JSON.parse(viewsCookie) : {}
      const now = Date.now()
      const lastView = views[input.id]

      if (!lastView || now - lastView > 24 * 60 * 60 * 1000) {
        views[input.id] = now
        await ctx.prisma.event.update({
          where: { id: input.id },
          data: { views: { increment: 1 } },
        })
        cookieStore.set('eventshare_views', JSON.stringify(views), {
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        })
      }

      return event
    }),

  getByQRToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { qrToken: input.token },
        include: {
          owner: { select: { id: true, name: true, image: true } },
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      if (event.qrExpiresAt && event.qrExpiresAt < new Date()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'QR code has expired' })
      }

      return event
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        date: z.string().transform(s => new Date(s)).optional(),
        privacy: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).optional(),
        coverImage: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const event = await ctx.prisma.event.findUnique({ where: { id } })
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })
      if (event.ownerId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not event owner' })
      }

      return ctx.prisma.event.update({ where: { id }, data })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({ where: { id: input.id } })
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })
      if (event.ownerId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      return ctx.prisma.event.delete({ where: { id: input.id } })
    }),

  getStorageUsage: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: { owner: true },
      })

      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })

      const photos = await ctx.prisma.photo.findMany({
        where: { eventId: input.eventId },
        select: { size: true },
      })

      const used = photos.reduce((sum: number, p: { size: number }) => sum + p.size, 0)
      const limit = event.storageLimit

      return { used, limit, remaining: Math.max(0, limit - used) }
    }),

  getCollaborators: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: { collaborators: { select: { id: true, name: true, email: true, image: true } }, owner: { select: { id: true } } },
      })
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owner can view collaborators' })
      return event.collaborators
    }),

  addCollaborator: protectedProcedure
    .input(z.object({ eventId: z.string(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: { owner: true, collaborators: true },
      })
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owner can add collaborators' })

      const userToAdd = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!userToAdd) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found with this email' })
      if (userToAdd.id === ctx.userId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot add yourself as collaborator' })

      const alreadyCollaborator = event.collaborators.some((c) => c.id === userToAdd.id)
      if (alreadyCollaborator) throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is already a collaborator' })

      const tier = (event.owner.subscriptionTier ?? 'FREE') as 'FREE' | 'PRO' | 'ENTERPRISE'
      const maxCollaborators = TIER_LIMITS[tier].collaborators
      if (maxCollaborators !== Infinity && event.collaborators.length >= maxCollaborators) {
        throw new TRPCError({ code: 'FORBIDDEN', message: `Hai raggiunto il limite di ${maxCollaborators} collaboratori per il tuo piano.` })
      }

      await ctx.prisma.event.update({
        where: { id: input.eventId },
        data: { collaborators: { connect: { id: userToAdd.id } } },
      })

      return { success: true, user: { id: userToAdd.id, name: userToAdd.name, email: userToAdd.email, image: userToAdd.image } }
    }),

  removeCollaborator: protectedProcedure
    .input(z.object({ eventId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({ where: { id: input.eventId } })
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owner can remove collaborators' })

      await ctx.prisma.event.update({
        where: { id: input.eventId },
        data: { collaborators: { disconnect: { id: input.userId } } },
      })

      return { success: true }
    }),
})