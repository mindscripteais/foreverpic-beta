import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

function isAdmin(ctx: { session?: { user?: { isAdmin?: boolean | null; email?: string | null } } | null }) {
  if (ctx.session?.user?.isAdmin === true) return true
  return ctx.session?.user?.email === 'egix.tuned@gmail.com'
}

export const adminRouter = createTRPCRouter({
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })

    const [userCount, eventCount, photoCount, totalStorage] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.event.count(),
      ctx.prisma.photo.count(),
      ctx.prisma.photo.aggregate({ _sum: { size: true } }),
    ])

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

    const todayUploads = await ctx.prisma.photo.count({ where: { createdAt: { gte: today } } })
    const yesterdayUploads = await ctx.prisma.photo.count({ where: { createdAt: { gte: yesterday, lt: today } } })

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - i); return d
    }).reverse()

    const dailyUploads = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date); nextDay.setDate(nextDay.getDate() + 1)
        const count = await ctx.prisma.photo.count({ where: { createdAt: { gte: date, lt: nextDay } } })
        return { date: date.toISOString().slice(0, 10), count }
      })
    )

    const last7DaysUsers = await ctx.prisma.user.count({ where: { createdAt: { gte: last7Days[0] } } })
    const last7DaysEvents = await ctx.prisma.event.count({ where: { createdAt: { gte: last7Days[0] } } })

    return { users: userCount, events: eventCount, photos: photoCount, totalStorage: totalStorage._sum.size || 0, todayUploads, yesterdayUploads, dailyUploads, last7DaysUsers, last7DaysEvents }
  }),

  users: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })

      const search = input?.search?.toLowerCase()
      const where = search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
        : {}

      const users = await ctx.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, include: { _count: { select: { ownedEvents: true, photos: true } } } })

      // Get storage used per user in one query
      const userIds = users.map((u) => u.id)
      const storageAgg = await ctx.prisma.photo.groupBy({
        by: ['eventId'],
        where: { event: { ownerId: { in: userIds } } },
        _sum: { size: true },
      })

      // Map eventId -> ownerId
      const events = await ctx.prisma.event.findMany({
        where: { ownerId: { in: userIds } },
        select: { id: true, ownerId: true },
      })
      const eventOwnerMap = new Map(events.map((e) => [e.id, e.ownerId]))

      // Aggregate by owner
      const storageByUser = new Map<string, number>()
      for (const agg of storageAgg) {
        const ownerId = eventOwnerMap.get(agg.eventId)
        if (ownerId) {
          storageByUser.set(ownerId, (storageByUser.get(ownerId) || 0) + (agg._sum.size || 0))
        }
      }

      return users.map((u) => ({ id: u.id, name: u.name, email: u.email, image: u.image, tier: u.subscriptionTier, isAdmin: u.isAdmin, eventCount: u._count.ownedEvents, photoCount: u._count.photos, totalStorage: storageByUser.get(u.id) || 0, createdAt: u.createdAt }))
    }),

  events: protectedProcedure
    .input(z.object({ search: z.string().optional(), privacy: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })

      const where: any = {}
      if (input?.search) where.name = { contains: input.search, mode: 'insensitive' }
      if (input?.privacy) where.privacy = input.privacy

      const events = await ctx.prisma.event.findMany({ where, orderBy: { createdAt: 'desc' }, include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { photos: true } }, photos: { select: { size: true } } } })

      return events.map((e) => ({ id: e.id, name: e.name, coverImage: e.coverImage, ownerName: e.owner.name, ownerEmail: e.owner.email, ownerId: e.owner.id, privacy: e.privacy, views: e.views, photoCount: e._count.photos, storageUsed: e.photos.reduce((sum, p) => sum + p.size, 0), autoDeleteAt: e.autoDeleteAt, createdAt: e.createdAt }))
    }),

  photos: protectedProcedure
    .input(z.object({ eventId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })

      const where: any = {}
      if (input?.eventId) where.eventId = input.eventId

      const photos = await ctx.prisma.photo.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { event: { select: { id: true, name: true } }, uploader: { select: { id: true, name: true } } } })

      return photos.map((p) => ({ id: p.id, url: p.url, thumbnail: p.thumbnail, eventName: p.event.name, eventId: p.event.id, uploaderName: p.uploader?.name || p.guestName || 'Anonimo', size: p.size, createdAt: p.createdAt }))
    }),

  activity: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })

    const [recentPhotos, recentUsers, recentEvents] = await Promise.all([
      ctx.prisma.photo.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { event: { select: { name: true } }, uploader: { select: { name: true } } } }),
      ctx.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { name: true, email: true, createdAt: true } }),
      ctx.prisma.event.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { owner: { select: { name: true } } } }),
    ])

    const activities = [
      ...recentPhotos.map((p) => ({ type: 'upload' as const, id: p.id, user: p.uploader?.name || p.guestName || 'Anonimo', event: p.event.name, createdAt: p.createdAt })),
      ...recentUsers.map((u) => ({ type: 'register' as const, id: u.email, user: u.name || u.email, event: 'Nuovo utente', createdAt: u.createdAt })),
      ...recentEvents.map((e) => ({ type: 'event' as const, id: e.id, user: e.owner.name || 'Anonimo', event: e.name, createdAt: e.createdAt })),
    ]

    return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50)
  }),

  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })

      const { deleteObject } = await import('@/lib/r2')
      const event = await ctx.prisma.event.findUnique({ where: { id: input.id }, include: { photos: { select: { key: true } } } })
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })

      for (const photo of event.photos) await deleteObject(photo.key)
      await ctx.prisma.event.delete({ where: { id: input.id } })
      return { success: true }
    }),

  deletePhoto: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' })

      const { deleteObject } = await import('@/lib/r2')
      const photo = await ctx.prisma.photo.findUnique({ where: { id: input.id }, select: { key: true } })
      if (!photo) throw new TRPCError({ code: 'NOT_FOUND' })

      await deleteObject(photo.key)
      await ctx.prisma.photo.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
