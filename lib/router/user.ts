import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { stripe, TIER_LIMITS, type SubscriptionTier } from '@/lib/stripe'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { ownedEvents: true } },
      },
    })

    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })

    const tier = user.subscriptionTier as SubscriptionTier
    const limits = TIER_LIMITS[tier]

    // Calculate total storage used via SQL aggregation
    const storageAgg = await ctx.prisma.photo.aggregate({
      where: { event: { ownerId: ctx.userId } },
      _sum: { size: true },
    })
    const totalStorageUsed = storageAgg._sum.size || 0

    const totalStorageLimit = limits.totalStorage
    const storagePercent = totalStorageLimit > 0 ? Math.min(100, (totalStorageUsed / totalStorageLimit) * 100) : 0

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      tier,
      limits,
      totalStorageUsed,
      totalStorageLimit,
      storagePercent,
      eventCount: user._count.ownedEvents,
      subscription: user.subscriptions[0] ?? null,
    }
  }),

  createCheckoutSession: protectedProcedure
    .input(z.object({ tier: z.enum(['PRO', 'ENTERPRISE']) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      })

      if (!user) throw new TRPCError({ code: 'NOT_FOUND' })

      const priceId =
        input.tier === 'PRO'
          ? process.env.STRIPE_PRO_PRICE_ID!
          : process.env.STRIPE_ENTERPRISE_PRICE_ID!

      // Reuse existing Stripe customer or create one
      let customerId = user.stripeCustomerId
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email })
        customerId = customer.id
        await ctx.prisma.user.update({
          where: { id: ctx.userId },
          data: { stripeCustomerId: customerId },
        })
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
        metadata: {
          userId: ctx.userId,
          tier: input.tier,
        },
      })

      return { url: session.url }
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
    })

    if (!user?.stripeCustomerId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No subscription found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    })

    return { url: session.url }
  }),

  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const events = await ctx.prisma.event.findMany({
      where: { ownerId: ctx.userId },
      include: {
        photos: { select: { id: true, size: true, reactions: true, votes: true } },
        _count: { select: { photos: true } },
      },
    })

    return events.map((event: { id: string; name: string; date: Date; views: number; _count: { photos: number }; photos: { size: number; reactions: unknown[]; votes: unknown[] }[] }) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      views: event.views,
      photoCount: event._count.photos,
      storageUsed: event.photos.reduce((sum: number, p: { size: number }) => sum + p.size, 0),
      totalReactions: event.photos.reduce((sum: number, p: { reactions: unknown[] }) => sum + p.reactions.length, 0),
      totalVotes: event.photos.reduce((sum: number, p: { votes: unknown[] }) => sum + p.votes.length, 0),
    }))
  }),
})