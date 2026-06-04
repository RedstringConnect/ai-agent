import { logger } from "./logger"

interface RetryOptions {
  retries?: number
  baseDelay?: number
  context?: string
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const retries = opts.retries ?? 3
  const baseDelay = opts.baseDelay ?? 1000
  let lastError: unknown

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        logger.warn(
          `Retry attempt ${attempt}/${retries} failed, retrying in ${delay}ms`,
          { err: error, attempt, retries, context: opts.context },
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
