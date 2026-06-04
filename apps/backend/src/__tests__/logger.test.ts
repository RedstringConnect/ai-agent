import { describe, it, expect, vi } from "vitest"
import { sanitizeBody, truncate } from "../logger"

describe("sanitizeBody", () => {
  it("sanitizes sensitive fields", () => {
    const result = sanitizeBody({
      email: "test@example.com",
      password: "secret123",
      name: "John",
    })
    expect(result).toEqual({
      email: "test@example.com",
      password: "[REDACTED]",
      name: "John",
    })
  })

  it("handles non-object inputs", () => {
    expect(sanitizeBody("string")).toBe("string")
  })

  it("handles null", () => {
    expect(sanitizeBody(null)).toBeNull()
  })

  it("sanitizes nested objects", () => {
    const result = sanitizeBody({
      user: { token: "abc", name: "John" },
    })
    expect(result).toEqual({
      user: { token: "[REDACTED]", name: "John" },
    })
  })

  it("sanitizes arrays", () => {
    const result = sanitizeBody([{ apiKey: "123" }, { name: "test" }])
    expect(result).toEqual([{ apiKey: "[REDACTED]" }, { name: "test" }])
  })
})

describe("truncate", () => {
  it("truncates long strings", () => {
    const long = "a".repeat(1000)
    expect(truncate(long, 500)).toBe("a".repeat(500) + "...")
  })

  it("keeps short strings", () => {
    expect(truncate("hello", 500)).toBe("hello")
  })
})
