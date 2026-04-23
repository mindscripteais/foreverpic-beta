import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

const ADMIN_EMAILS = ['mindscript.eais@gmail.com'] // Add your email here

function isAdmin(userEmail?: string | null) {
  return !!userEmail && ADMIN_EMAILS.includes(userEmail)
}

export const adminRouter = createTRPCRouter({
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.session?.user?.email)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })
    }

    const [userCount, eventCount, photoCount, totalStorage] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.event.count(),
      ctx.prisma.photo.count(),
      ctx.prisma.photo.aggregate({ _sum: { size: true } }),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUploads = await ctx.prisma.photo.count({
      where: { createdAt: { gte: today } },
    })

    return {
      users: userCount,
      events: eventCount,
      photos: photoCount,
      totalStorage: totalStorage._sum.size || 0,
      todayUploads,
    }
  }),

  users: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.session?.user?.email)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })
    }

    const users = await ctx.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { ownedEvents: true, photos: true } },
      },
    })

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      tier: u.subscriptionTier,
      isAdmin: u.isAdmin,
      eventCount: u._count.ownedEvents,
      photoCount: u._count.photos,
      createdAt: u.createdAt,
    }))
  }),

  events: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.session?.user?.email)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })
    }

    const events = await ctx.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { photos: true } },
        photos: { select: { size: true } },
      },
    })

    return events.map((e) => ({
      id: e.id,
      name: e.name,
      ownerName: e.owner.name,
      ownerEmail: e.owner.email,
      privacy: e.privacy,
      views: e.views,
      photoCount: e._count.photos,
      storageUsed: e.photos.reduce((sum, p) => sum + p.size, 0),
      autoDeleteAt: e.autoDeleteAt,
      createdAt: e.createdAt,
    }))
  }),

  photos: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.session?.user?.email)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })
    }

    const photos = await ctx.prisma.photo.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        event: { select: { id: true, name: true } },
        uploader: { select: { id: true, name: true } },
      },
    })

    return photos.map((p) => ({
      id: p.id,
      url: p.url,
      thumbnail: p.thumbnail,
      eventName: p.event.name,
      eventId: p.event.id,
      uploaderName: p.uploader?.name || p.guestName || 'Anonimo',
      size: p.size,
      createdAt: p.createdAt,
    }))
  }),

  activity: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.session?.user?.email)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })
    }

    const recentPhotos = await ctx.prisma.photo.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        event: { select: { name: true } },
        uploader: { select: { name: true } },
      },
    })

    return recentPhotos.map((p) => ({
      type: 'upload' as const,
      id: p.id,
      user: p.uploader?.name || p.guestName || 'Anonimo',
      event: p.event.name,
      createdAt: p.createdAt,
    }))
  }),

  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.session?.user?.email)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })
      }

      const { deleteObject } = await import('@/lib/r2')
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
        include: { photos: { select: { key: true } } },
      })

      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })

      for (const photo of event.photos) {
        await deleteObject(photo.key)
      }

      await ctx.prisma.event.delete({ where: { id: input.id } })
      return { success: true }
    }),

  deletePhoto: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.session?.user?.email)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })
      }

      const { deleteObject } = await import('@/lib/r2')
      const photo = await ctx.prisma.photo.findUnique({
        where: { id: input.id },
        select: { key: true },
      })

      if (!photo) throw new TRPCError({ code: 'NOT_FOUND' })

      await deleteObject(photo.key)
      await ctx.prisma.photo.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
