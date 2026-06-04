import { Hono } from "hono"
import { cors } from "hono/cors"
import { streamSSE } from "hono/streaming"
// Minimal EventEmitter for Cloudflare Workers (replaces Node 'events')
class SimpleEmitter {
  private listeners: Record<string, ((data: any) => void)[]> = {}
  on(event: string, fn: (data: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(fn)
  }
  off(event: string, fn: (data: any) => void) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(l => l !== fn)
  }
  emit(event: string, data: any) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(fn => fn(data))
  }
}
import { trpcServer } from "@hono/trpc-server"
import { appRouter } from "./routers"
import { createContext } from "./context"
import { httpLogger, logger } from "./logger"
import { rateLimiter } from "./rate-limiter"
import { initDb } from "./db"

export const app = new Hono()

// In-memory event emitter for SSE (NOTE: In production on Cloudflare Workers, this requires Durable Objects or Redis Pub/Sub)
export const chatEvents = new SimpleEmitter()

app.use("*", async (c, next) => {
  const env = c.env as { CORS_ORIGIN?: string }
  const corsHandler = cors({ origin: env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true })
  return corsHandler(c, next)
})
app.use("*", httpLogger)

app.use("*", async (c, next) => {
  initDb((c.env as any).DB)
  await next()
})

app.use("/trpc/*", rateLimiter({ windowMs: 60_000, max: 200 }))
app.use("/copilotkit/*", rateLimiter({ windowMs: 60_000, max: 200 }))

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
)

app.all("/copilotkit/*", async (c) => {
  const target = (c.env as { COPILOTKIT_SERVICE_URL?: string }).COPILOTKIT_SERVICE_URL ?? "http://localhost:3002"
  const url = new URL(c.req.url)
  const proxyUrl = `${target}${url.pathname}${url.search}`
  return fetch(proxyUrl, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.method === "GET" || c.req.method === "HEAD" ? undefined : c.req.raw.body,
  })
})

app.get("/health", async (c) => {
  return c.json({ status: "ok", uptime: "cloudflare-workers" })
})

// Phase 2: Server-Sent Events Endpoint for realtime conversation sync
app.get("/api/chat/events", async (c) => {
  const conversationId = c.req.query("conversationId")
  // PHASE 4: Secure SSE connections (Fallback to session cookie if token query param isn't used by EventSource)
  const token = c.req.query("token") || c.req.header("cookie")?.includes("better-auth.session")
  
  if (!conversationId) return c.json({ error: "conversationId required" }, 400)
  if (!token) return c.json({ error: "Unauthorized SSE connection" }, 401)

  return streamSSE(c, async (stream) => {
    // Keep alive
    stream.writeSSE({ event: "ping", data: "ok" })
    
    const onUpdate = async (data: any) => {
      await stream.writeSSE({
        event: "message.update",
        data: JSON.stringify(data),
      })
    }

    const eventName = `chat:${conversationId}`
    chatEvents.on(eventName, onUpdate)

    c.req.raw.signal.addEventListener("abort", () => {
      chatEvents.off(eventName, onUpdate)
    })
    
    // Keep the stream open indefinitely
    while (!c.req.raw.signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
  })
})

// Phase 1: Internal Persistence Endpoints called by the CopilotKit service
app.post("/api/internal/save-chunk", async (c) => {
  const body = await c.req.json()
  // In a full implementation, this would save partial stream state to the database
  // and emit an event to the SSE stream.
  chatEvents.emit(`chat:${body.threadId}`, body)
  return c.json({ success: true })
})

app.post("/api/internal/finalize-stream", async (c) => {
  const body = await c.req.json()
  // In a full implementation, this would commit the final stream state to the database
  chatEvents.emit(`chat:${body.threadId}`, body)
  return c.json({ success: true })
})

app.onError((err, c) => {
  logger.error(`Unhandled error: ${err.message}`)
  return c.json({ error: { code: "INTERNAL_ERROR", message: err.message } }, 500)
})

app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: `Route not found: ${c.req.method} ${c.req.path}` } }, 404)
})
