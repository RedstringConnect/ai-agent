import type { Context, Next } from "hono"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function rateLimiter(opts: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message } = opts

  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? "unknown"
    const now = Date.now()

    let entry = store.get(ip)
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      store.set(ip, entry)
    }

    entry.count++

    c.res.headers.set("X-RateLimit-Limit", String(max))
    c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)))
    c.res.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)))

    if (entry.count > max) {
      return c.json(
        { error: { code: "RATE_LIMITED", message: message ?? "Too many requests, try again later" } },
        429,
      )
    }

    await next()
  }
}
