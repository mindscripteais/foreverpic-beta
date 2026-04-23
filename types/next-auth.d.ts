import { SubscriptionTier } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      subscriptionTier: SubscriptionTier | 'FREE'
      isAdmin: boolean
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    subscriptionTier?: SubscriptionTier | 'FREE'
    isAdmin?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string
    tier?: string
    isAdmin?: boolean
  }
}
