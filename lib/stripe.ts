import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const TIER_PRICES = {
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
} as const

export const TIER_LIMITS = {
  FREE: {
    storagePerEvent: 500 * 1024 * 1024, // 500MB
    totalStorage: 1.5 * 1024 * 1024 * 1024, // 1.5GB total
    eventsPerMonth: 3,
    collaborators: 0,
    qrExpiration: 30, // days
    watermark: true,
  },
  PRO: {
    storagePerEvent: 5 * 1024 * 1024 * 1024, // 5GB
    totalStorage: 15 * 1024 * 1024 * 1024, // 15GB total
    eventsPerMonth: Infinity,
    collaborators: 5,
    qrExpiration: Infinity, // never expires
    watermark: false,
  },
  ENTERPRISE: {
    storagePerEvent: 50 * 1024 * 1024 * 1024, // 50GB
    totalStorage: 150 * 1024 * 1024 * 1024, // 150GB total
    eventsPerMonth: Infinity,
    collaborators: Infinity,
    qrExpiration: Infinity,
    watermark: false,
  },
} as const

export type SubscriptionTier = keyof typeof TIER_LIMITS

export function getStorageLimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].storagePerEvent
}

export function canUseFeature(
  tier: SubscriptionTier,
  feature: 'collaborators' | 'qrExpiration' | 'watermark'
): boolean | number {
  const limit = TIER_LIMITS[tier]
  switch (feature) {
    case 'collaborators':
      return limit.collaborators
    case 'qrExpiration':
      return limit.qrExpiration
    case 'watermark':
      return !limit.watermark
  }
}