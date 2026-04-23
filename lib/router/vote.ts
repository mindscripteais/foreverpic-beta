import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { triggerVoteCast, triggerVoteRemoved } from '@/lib/pusher'

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

export const voteRouter = createTRPCRouter({
  cast: protectedProcedure
    .input(z.object({ photoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const photo = await assertEventAccess(ctx.prisma, input.photoId, ctx.userId)

      // Check if already voted
      const existing = await ctx.prisma.vote.findUnique({
        where: {
          userId_photoId: {
            userId: ctx.userId,
            photoId: input.photoId,
          },
        },
      })

      if (existing) {
        return existing
      }

      const vote = await ctx.prisma.vote.create({
        data: {
          userId: ctx.userId,
          photoId: input.photoId,
        },
      })

      triggerVoteCast(photo.eventId, input.photoId)
      return vote
    }),

  remove: protectedProcedure
    .input(z.object({ photoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const photo = await assertEventAccess(ctx.prisma, input.photoId, ctx.userId)

      await ctx.prisma.vote.deleteMany({
        where: {
          userId: ctx.userId,
          photoId: input.photoId,
        },
      })

      triggerVoteRemoved(photo.eventId, input.photoId)
    }),
})
