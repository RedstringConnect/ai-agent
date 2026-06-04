import { router } from "../trpc"
import { conversationsRouter } from "./conversations"
import { candidatesRouter } from "./candidates"
import { catalogueRouter } from "./catalogue"
import { internalRouter } from "./internal"

export const appRouter = router({
  conversations: conversationsRouter,
  candidates: candidatesRouter,
  catalogue: catalogueRouter,
  internal: internalRouter,
})

export type AppRouter = typeof appRouter
