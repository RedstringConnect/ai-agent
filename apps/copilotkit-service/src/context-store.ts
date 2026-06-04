import { logger } from "./logger"

const MAX_CHATS = 1000
const MAX_TOOL_RESULTS = 20
const MAX_REQUIREMENT_FIELDS = 50

export interface ChatContext {
  requirements: Record<string, unknown>
  collectedFields: string[]
  preferences: Record<string, string>
  previousToolResults: Array<{ toolName: string; result: string; timestamp: number }>
}

function createEmptyContext(): ChatContext {
  return {
    requirements: {},
    collectedFields: [],
    preferences: {},
    previousToolResults: [],
  }
}

class ContextStore {
  private store = new Map<string, ChatContext>()
  private accessOrder: string[] = []

  get(chatId: string): ChatContext {
    let ctx = this.store.get(chatId)
    if (!ctx) {
      ctx = createEmptyContext()
      this.evictIfNeeded()
      this.store.set(chatId, ctx)
      this.accessOrder.push(chatId)
    } else {
      this.touch(chatId)
    }
    return ctx
  }

  set(chatId: string, ctx: ChatContext): void {
    this.evictIfNeeded()
    this.store.set(chatId, ctx)
    this.accessOrder.push(chatId)
  }

  appendRequirement(chatId: string, id: string, value: unknown): void {
    const ctx = this.get(chatId)
    if (ctx.collectedFields.length >= MAX_REQUIREMENT_FIELDS) return
    ctx.requirements[id] = value
    if (!ctx.collectedFields.includes(id)) {
      ctx.collectedFields.push(id)
    }
  }

  appendToolResult(chatId: string, toolName: string, result: string): void {
    const ctx = this.get(chatId)
    ctx.previousToolResults.push({ toolName, result, timestamp: Date.now() })
    if (ctx.previousToolResults.length > MAX_TOOL_RESULTS) {
      ctx.previousToolResults = ctx.previousToolResults.slice(-MAX_TOOL_RESULTS)
    }
  }

  clear(chatId: string): void {
    this.store.delete(chatId)
    const idx = this.accessOrder.indexOf(chatId)
    if (idx !== -1) this.accessOrder.splice(idx, 1)
  }

  formatContextSummary(chatId: string): string {
    const ctx = this.get(chatId)
    const parts: string[] = []

    if (ctx.collectedFields.length > 0) {
      const fields = ctx.collectedFields
        .map((id) => `  - ${id}: ${JSON.stringify(ctx.requirements[id])}`)
        .join("\n")
      parts.push(`Known information about this request:\n${fields}`)
    }

    if (ctx.previousToolResults.length > 0) {
      const last = ctx.previousToolResults[ctx.previousToolResults.length - 1]
      if (last) {
        parts.push(`Previous action result (${last.toolName}): ${last.result.slice(0, 300)}`)
      }
    }

    return parts.length > 0 ? parts.join("\n\n") : ""
  }

  private touch(chatId: string): void {
    const idx = this.accessOrder.indexOf(chatId)
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1)
      this.accessOrder.push(chatId)
    }
  }

  private evictIfNeeded(): void {
    while (this.store.size >= MAX_CHATS) {
      const oldest = this.accessOrder.shift()
      if (!oldest) break
      this.store.delete(oldest)
      logger.warn("Evicted from context store", { chatId: oldest })
    }
  }

  get size(): number {
    return this.store.size
  }
}

export const contextStore = new ContextStore()
