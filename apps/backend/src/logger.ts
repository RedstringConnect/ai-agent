import type { Context, Next } from "hono"

function timestamp() {
  return new Date().toISOString().slice(11, 19)
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(`[${timestamp()}] INFO: ${msg}`, meta ?? ""),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(`[${timestamp()}] WARN: ${msg}`, meta ?? ""),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(`[${timestamp()}] ERROR: ${msg}`, meta ?? ""),
  debug: (msg: string, meta?: Record<string, unknown>) =>
    console.debug(`[${timestamp()}] DEBUG: ${msg}`, meta ?? ""),
}

export async function httpLogger(c: Context, next: Next) {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path

  logger.debug(`--> ${method} ${path}`)
  await next()
  const duration = Date.now() - start
  const status = c.res.status

  ;(status >= 400 ? logger.error : logger.info)(`<-- ${method} ${path} ${status} (${duration}ms)`)
}
