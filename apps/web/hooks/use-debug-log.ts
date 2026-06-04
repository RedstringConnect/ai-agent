const PREFIX = "[Kira]"

export function useDebugLog(scope: string) {
  function log(event: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === "development") {
      console.log(`${PREFIX} [${scope}] [${Date.now()}] ${event}`, ...args)
    }
  }

  return { log }
}
