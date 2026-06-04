import { describe, it, expect, beforeEach } from "vitest"
import { contextStore } from "../context-store"

describe("contextStore", () => {
  beforeEach(() => {
    // Reset the context store by clearing all entries
    // We can't access internal state, so we just clear chat IDs we know about
  })

  it("creates empty context for new chat", () => {
    const ctx = contextStore.get("chat-1")
    expect(ctx.requirements).toEqual({})
    expect(ctx.collectedFields).toEqual([])
    expect(ctx.preferences).toEqual({})
    expect(ctx.previousToolResults).toEqual([])
  })

  it("returns same context for same chatId", () => {
    const ctx1 = contextStore.get("chat-2")
    ctx1.requirements.role = "Engineer"

    const ctx2 = contextStore.get("chat-2")
    expect(ctx2.requirements.role).toBe("Engineer")
  })

  it("appends requirements", () => {
    contextStore.appendRequirement("chat-3", "role", "Frontend Developer")
    contextStore.appendRequirement("chat-3", "location", "Remote")

    const ctx = contextStore.get("chat-3")
    expect(ctx.requirements.role).toBe("Frontend Developer")
    expect(ctx.requirements.location).toBe("Remote")
    expect(ctx.collectedFields).toEqual(["role", "location"])
  })

  it("does not duplicate collected fields", () => {
    contextStore.appendRequirement("chat-4", "role", "Engineer")
    contextStore.appendRequirement("chat-4", "role", "Senior Engineer")

    const ctx = contextStore.get("chat-4")
    expect(ctx.collectedFields).toEqual(["role"])
    expect(ctx.requirements.role).toBe("Senior Engineer")
  })

  it("appends tool results", () => {
    contextStore.appendToolResult("chat-5", "search", "Found 3 candidates")
    contextStore.appendToolResult("chat-5", "schedule", "Created interview")

    const ctx = contextStore.get("chat-5")
    expect(ctx.previousToolResults).toHaveLength(2)
    expect(ctx.previousToolResults[0].toolName).toBe("search")
    expect(ctx.previousToolResults[1].toolName).toBe("schedule")
  })

  it("limits tool results to 20", () => {
    for (let i = 0; i < 25; i++) {
      contextStore.appendToolResult("chat-6", `tool-${i}`, `result-${i}`)
    }

    const ctx = contextStore.get("chat-6")
    expect(ctx.previousToolResults).toHaveLength(20)
    expect(ctx.previousToolResults[0].toolName).toBe("tool-5")
  })

  it("clears chat context", () => {
    contextStore.appendRequirement("chat-7", "role", "Engineer")
    contextStore.clear("chat-7")

    const ctx = contextStore.get("chat-7")
    expect(ctx.requirements).toEqual({})
    expect(ctx.collectedFields).toEqual([])
  })

  it("formats context summary", () => {
    contextStore.appendRequirement("chat-8", "role", "Backend Developer")
    contextStore.appendToolResult("chat-8", "search", "Found 2 matches")

    const summary = contextStore.formatContextSummary("chat-8")
    expect(summary).toContain("Backend Developer")
    expect(summary).toContain("search")
    expect(summary).toContain("Found 2 matches")
  })

  it("returns empty string for empty context", () => {
    const summary = contextStore.formatContextSummary("chat-9")
    expect(summary).toBe("")
  })
})
