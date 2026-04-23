import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { triggerReactionAdded, triggerReactionRemoved } from '@/lib/pusher'

async function assertEventAccess(prisma: any, photoId: string, userId: string) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      event: {
        include: {
          collaborators: { select: { id: true } },
        },
      },
    },
  })

  if (!photo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Photo not found' })

  const event = photo.event
  if (event.privacy === 'PUBLIC') return photo

  const isOwner = event.ownerId === userId
  const isCollaborator = event.collaborators.some((c: { id: string }) => c.id === userId)

  if (!isOwner && !isCollaborator) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this event' })
  }

  return photo
}

export const reactionRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        photoId: z.string(),
        type: z.enum(['LOVE', 'LAUGH', 'WOW', 'HEART', 'FIRE']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const photo = await assertEventAccess(ctx.prisma, input.photoId, ctx.userId)

      // Check if already reacted with this type
      const existing = await ctx.prisma.reaction.findUnique({
        where: {
          userId_photoId_type: {
            userId: ctx.userId,
            photoId: input.photoId,
            type: input.type,
          },
        },
      })

      if (existing) {
        return existing
      }

      const reaction = await ctx.prisma.reaction.create({
        data: {
          type: input.type,
          userId: ctx.userId,
          photoId: input.photoId,
        },
      })

      triggerReactionAdded(photo.eventId, input.photoId, input.type)
      return reaction
    }),

  remove: protectedProcedure
    .input(
      z.object({
        photoId: z.string(),
        type: z.enum(['LOVE', 'LAUGH', 'WOW', 'HEART', 'FIRE']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const photo = await assertEventAccess(ctx.prisma, input.photoId, ctx.userId)

      await ctx.prisma.reaction.deleteMany({
        where: {
          userId: ctx.userId,
          photoId: input.photoId,
          type: input.type,
        },
      })

      triggerReactionRemoved(photo.eventId, input.photoId, input.type)
    }),

  getForPhoto: publicProcedure
    .input(z.object({ photoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reactions = await ctx.prisma.reaction.groupBy({
        by: ['type'],
        where: { photoId: input.photoId },
        _count: true,
      })

      return reactions.map((r: { type: string; _count: number }) => ({
        type: r.type,
        count: r._count,
      }))
    }),
})
