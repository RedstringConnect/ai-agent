import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import type { Context, Next } from "hono"

function createMockContext(headers: Record<string, string> = {}): Context {
  return {
    req: {
      header: (name: string) => headers[name] ?? null,
      method: "GET",
      path: "/test",
      raw: new Request("http://localhost/test"),
      url: "http://localhost/test",
    },
    res: {
      headers: new Map<string, string>(),
      status: 200,
      json: vi.fn().mockReturnThis(),
    },
    set: vi.fn(),
    get: vi.fn(),
    var: {},
    newResponse: vi.fn(),
    body: vi.fn(),
    text: vi.fn(),
    notFound: vi.fn(),
    redirect: vi.fn(),
    html: vi.fn(),
    blob: vi.fn(),
    stream: vi.fn(),
    json: vi.fn(),
  } as unknown as Context
}

describe("rate-limiter", () => {
  let rateLimiter: any

  beforeAll(async () => {
    // The rate limiter module uses module-level state (Map). We need to import it fresh.
    const mod = await import("../rate-limiter")
    rateLimiter = mod.rateLimiter
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it("allows requests within limit", async () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 10 })
    const ctx = createMockContext({ "x-forwarded-for": "127.0.0.1" })
    const next = vi.fn()

    for (let i = 0; i < 10; i++) {
      await limiter(ctx, next)
    }

    expect(next).toHaveBeenCalledTimes(10)
  })

  it("blocks requests exceeding limit", async () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 3 })
    const ctx = createMockContext({ "x-forwarded-for": "127.0.0.2" })
    const next = vi.fn()

    await limiter(ctx, next) // 1
    await limiter(ctx, next) // 2
    await limiter(ctx, next) // 3
    await limiter(ctx, next) // 4 - should be blocked

    expect(next).toHaveBeenCalledTimes(3)
    // Should return 429 for the 4th request
  })

  it("resets after window expires", async () => {
    const limiter = rateLimiter({ windowMs: 1000, max: 2 })
    const ctx = createMockContext({ "x-forwarded-for": "127.0.0.3" })
    const next = vi.fn()

    await limiter(ctx, next) // 1
    await limiter(ctx, next) // 2

    // Advance time past window
    vi.advanceTimersByTime(1500)

    await limiter(ctx, next) // should be allowed again (new window)

    expect(next).toHaveBeenCalledTimes(3)
  })

  it("sets rate limit headers", async () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 10 })
    const ctx = createMockContext({ "x-forwarded-for": "127.0.0.4" })
    const next = vi.fn()

    await limiter(ctx, next)

    expect(ctx.res.headers.get("X-RateLimit-Limit")).toBe("10")
    expect(ctx.res.headers.get("X-RateLimit-Remaining")).toBe("9")
  })

  it("uses custom error message", async () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 1, message: "Back off!" })
    const ctx = createMockContext({ "x-forwarded-for": "127.0.0.5" })
    const next = vi.fn()

    await limiter(ctx, next) // 1
    await limiter(ctx, next) // 2 - blocked
  })
})
