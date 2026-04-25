import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { generatePhotoKey, generateUploadUrl, generateDownloadUrl, getPublicUrl, isR2Configured } from '@/lib/r2'
import { TIER_LIMITS } from '@/lib/stripe'
import { triggerPhotoAdded } from '@/lib/pusher'
import { rateLimit, rateLimits } from '@/lib/rate-limit'

export const photoRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        filename: z.string(),
        contentType: z.string(),
        size: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rateLimitResult = rateLimit(`upload:${ctx.userId}`, rateLimits.upload)
      if (!rateLimitResult.success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many uploads. Please try again later.' })
      }

      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: { owner: true, collaborators: true },
      })

      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })

      const isOwner = event.ownerId === ctx.userId
      const isCollaborator = event.collaborators.some((c: { id: string }) => c.id === ctx.userId)

      if (!isOwner && !isCollaborator && event.privacy !== 'PUBLIC') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this event' })
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: ctx.userId } })
      const tier = (user?.subscriptionTier ?? 'FREE') as 'FREE' | 'PRO' | 'ENTERPRISE'
      const limit = TIER_LIMITS[tier].storagePerEvent

      const currentPhotos = await ctx.prisma.photo.findMany({
        where: { eventId: input.eventId },
        select: { size: true },
      })

      const used = currentPhotos.reduce((sum: number, p: { size: number }) => sum + p.size, 0)

      if (used + input.size > limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Storage limit reached (${limit / 1024 / 1024}MB per event on your tier). Upgrade for more.`,
        })
      }

      const key = generatePhotoKey(input.eventId, ctx.userId, input.filename)

      if (!isR2Configured()) {
        return { uploadUrl: null, key, publicUrl: null, localUpload: true as const }
      }

      const uploadUrl = await generateUploadUrl(key, input.contentType)
      return { uploadUrl, key, publicUrl: getPublicUrl(key), localUpload: false as const }
    }),

  confirmUpload: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        key: z.string(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        type: z.enum(['PHOTO', 'VIDEO']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: { owner: true, collaborators: true },
      })

      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })

      const isOwner = event.ownerId === ctx.userId
      const isCollaborator = event.collaborators.some((c: { id: string }) => c.id === ctx.userId)

      if (!isOwner && !isCollaborator && event.privacy !== 'PUBLIC') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this event' })
      }

      const publicUrl = getPublicUrl(input.key)
      const thumbnailUrl = publicUrl

      const photo = await ctx.prisma.photo.create({
        data: {
          key: input.key,
          url: publicUrl,
          thumbnail: thumbnailUrl,
          type: input.type ?? 'PHOTO',
          size: input.size,
          width: input.width,
          height: input.height,
          eventId: input.eventId,
          uploaderId: ctx.userId,
        },
      })

      triggerPhotoAdded(input.eventId, photo.id)
      return photo
    }),

  getGuestUploadUrl: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        filename: z.string(),
        contentType: z.string(),
        size: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rateLimitResult = rateLimit(`upload:guest:${input.eventId}`, rateLimits.upload)
      if (!rateLimitResult.success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many uploads for this event. Please try again later.' })
      }

      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: { owner: true },
      })

      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })

      if (event.privacy !== 'PUBLIC') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only public events allow guest uploads' })
      }

      if (event.qrExpiresAt && event.qrExpiresAt < new Date()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'QR code has expired' })
      }

      const tier = (event.owner.subscriptionTier ?? 'FREE') as 'FREE' | 'PRO' | 'ENTERPRISE'
      const limit = TIER_LIMITS[tier].storagePerEvent

      const currentPhotos = await ctx.prisma.photo.findMany({
        where: { eventId: input.eventId },
        select: { size: true },
      })

      const used = currentPhotos.reduce((sum: number, p: { size: number }) => sum + p.size, 0)

      if (used + input.size > limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Storage limit reached for this event.`,
        })
      }

      const key = generatePhotoKey(input.eventId, 'guest', input.filename)

      if (!isR2Configured()) {
        return { uploadUrl: null, key, publicUrl: null, localUpload: true as const }
      }

      const uploadUrl = await generateUploadUrl(key, input.contentType)
      return { uploadUrl, key, publicUrl: getPublicUrl(key), localUpload: false as const }
    }),

  confirmGuestUpload: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        key: z.string(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        guestName: z.string().min(1).max(100),
        type: z.enum(['PHOTO', 'VIDEO']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
      })

      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })

      if (event.privacy !== 'PUBLIC') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only public events allow guest uploads' })
      }

      if (event.qrExpiresAt && event.qrExpiresAt < new Date()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'QR code has expired' })
      }

      const publicUrl = getPublicUrl(input.key)
      const thumbnailUrl = publicUrl

      const photo = await ctx.prisma.photo.create({
        data: {
          key: input.key,
          url: publicUrl,
          thumbnail: thumbnailUrl,
          type: input.type ?? 'PHOTO',
          size: input.size,
          width: input.width,
          height: input.height,
          eventId: input.eventId,
          guestName: input.guestName,
        },
      })

      triggerPhotoAdded(input.eventId, photo.id)
      return photo
    }),

  list: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const photos = await ctx.prisma.photo.findMany({
        where: { eventId: input.eventId },
        include: {
          reactions: true,
          votes: true,
          uploader: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      })

      let nextCursor: string | undefined
      if (photos.length > input.limit) {
        const next = photos.pop()
        nextCursor = next?.id
      }

      return { photos, nextCursor }
    }),

  getDownloadUrls: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: { owner: true, collaborators: true },
      })

      if (!event) throw new TRPCError({ code: 'NOT_FOUND' })

      const isOwner = event.ownerId === ctx.userId
      const isCollaborator = event.collaborators.some((c: { id: string }) => c.id === ctx.userId)

      if (!isOwner && !isCollaborator) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this event' })
      }

      const photos = await ctx.prisma.photo.findMany({
        where: { eventId: input.eventId },
        select: { id: true, key: true, url: true },
      })

      const urls = await Promise.all(
        photos.map(async (photo) => {
          let downloadUrl: string | null = null
          if (photo.url.startsWith('data:')) {
            downloadUrl = photo.url
          } else if (isR2Configured()) {
            try {
              downloadUrl = await generateDownloadUrl(photo.key)
            } catch {
              downloadUrl = null
            }
          }
          return { id: photo.id, url: photo.url, downloadUrl }
        })
      )

      return { urls }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const photo = await ctx.prisma.photo.findUnique({
        where: { id: input.id },
        include: { event: true },
      })

      if (!photo) throw new TRPCError({ code: 'NOT_FOUND' })

      const isEventOwner = photo.event.ownerId === ctx.userId
      const isPhotoUploader = photo.uploaderId === ctx.userId

      if (!isEventOwner && !isPhotoUploader) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete this photo' })
      }

      const { deleteObject } = await import('@/lib/r2')
      await deleteObject(photo.key)

      return ctx.prisma.photo.delete({ where: { id: input.id } })
    }),
})
