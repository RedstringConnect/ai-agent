import { initTRPC } from "@trpc/server"
import type { Context } from "./context"

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

// PHASE 4: Enforce User ID validation on tRPC routes
const isAuthed = t.middleware(({ ctx, next }) => {
  // In a real implementation, extract the session from Better Auth or JWT
  const authToken = ctx.req.headers.get("authorization")
  if (!authToken) {
    throw new Error("UNAUTHORIZED")
  }
  return next({
    ctx: {
      userId: "user_from_token", // Stub
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed)
