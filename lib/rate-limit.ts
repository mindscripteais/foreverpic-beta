// Simple in-memory rate limiter for beta
// TODO: Replace with Redis-based rate limiter for production scale

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000)

interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { success: boolean; limit: number; remaining: number; resetAt: number } {
  const { windowMs = 60 * 1000, maxRequests = 10 } = options
  const now = Date.now()

  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs
    store.set(identifier, { count: 1, resetAt })
    return { success: true, limit: maxRequests, remaining: maxRequests - 1, resetAt }
  }

  if (entry.count >= maxRequests) {
    return { success: false, limit: maxRequests, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, limit: maxRequests, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// Preset configurations for common use cases
export const rateLimits = {
  upload: { windowMs: 60 * 1000, maxRequests: 5 },      // 5 uploads per minute
  createEvent: { windowMs: 60 * 1000, maxRequests: 3 }, // 3 events per minute
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },  // 10 auth attempts per 15 min
  api: { windowMs: 60 * 1000, maxRequests: 60 },        // 60 API calls per minute
}
