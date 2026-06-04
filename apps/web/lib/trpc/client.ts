import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "backend"

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>()
