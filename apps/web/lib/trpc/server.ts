import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "backend"

export const trpcServer = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3001/trpc",
    }),
  ],
})
