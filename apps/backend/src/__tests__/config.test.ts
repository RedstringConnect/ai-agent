import { describe, it, expect, beforeAll } from "vitest"
import { z } from "zod"

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("kira.db"),
})

describe("config schema", () => {
  it("accepts valid environment variables", () => {
    const result = envSchema.safeParse({
      GROQ_API_KEY: "gsk_abc123",
      BETTER_AUTH_SECRET: "supersecret",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.PORT).toBe(3001)
      expect(result.data.NODE_ENV).toBe("development")
    }
  })

  it("rejects missing GROQ_API_KEY", () => {
    const result = envSchema.safeParse({
      BETTER_AUTH_SECRET: "supersecret",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing BETTER_AUTH_SECRET", () => {
    const result = envSchema.safeParse({
      GROQ_API_KEY: "gsk_abc123",
    })
    expect(result.success).toBe(false)
  })

  it("accepts custom PORT", () => {
    const result = envSchema.safeParse({
      GROQ_API_KEY: "gsk_abc123",
      BETTER_AUTH_SECRET: "supersecret",
      PORT: "8080",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.PORT).toBe(8080)
    }
  })

  it("accepts test NODE_ENV", () => {
    const result = envSchema.safeParse({
      GROQ_API_KEY: "gsk_abc123",
      BETTER_AUTH_SECRET: "supersecret",
      NODE_ENV: "test",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.NODE_ENV).toBe("test")
    }
  })
})
