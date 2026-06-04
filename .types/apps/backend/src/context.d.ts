import type { inferAsyncReturnType } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
export declare function createContext(opts: FetchCreateContextFnOptions): Promise<{
    req: Request;
    userId: string | null;
}>;
export type Context = inferAsyncReturnType<typeof createContext>;
//# sourceMappingURL=context.d.ts.map