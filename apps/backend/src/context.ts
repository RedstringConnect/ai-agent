import type { inferAsyncReturnType } from "@trpc/server"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import type { Context as HonoContext } from "hono"
import { initDb } from "./db"
import type { Env } from "./env"

export async function createContext(_opts: FetchCreateContextFnOptions, c: HonoContext) {
  const env = c.env as Env
  const db = initDb(env.DB)

  return {
    req: _opts.req,
    db,
    env,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>
