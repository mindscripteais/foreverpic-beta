import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type { SubscriptionTier } from '@/lib/stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier as SubscriptionTier

        if (!userId || !tier) break

        // Retrieve subscription to get correct period end
        const subscription = await stripe.subscriptions.retrieve(session.subscription)

        // Update user subscription tier
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: tier,
            stripeCustomerId: session.customer,
          },
        })

        // Create subscription record
        await prisma.subscription.create({
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: session.customer,
            tier,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            userId,
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        const tier = subscription.metadata?.tier as SubscriptionTier ||
          (subscription.items.data[0]?.price?.metadata?.tier as SubscriptionTier) ||
          'FREE'

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionTier: tier },
        })

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            tier,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionTier: 'FREE' },
        })

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { tier: 'FREE' },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
