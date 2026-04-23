import { createTRPCRouter } from '@/lib/trpc'
import { eventRouter } from './event'
import { photoRouter } from './photo'
import { reactionRouter } from './reaction'
import { voteRouter } from './vote'
import { qrRouter } from './qr'
import { userRouter } from './user'
import { adminRouter } from './admin'

export const appRouter = createTRPCRouter({
  event: eventRouter,
  photo: photoRouter,
  reaction: reactionRouter,
  vote: voteRouter,
  qr: qrRouter,
  user: userRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter