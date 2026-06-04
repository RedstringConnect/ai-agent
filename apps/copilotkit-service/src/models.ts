import { createOpenAI } from "@ai-sdk/openai"

const GROQ_BASE_URL = "https://api.groq.com/openai/v1"

const groq = (apiKey: string) =>
  createOpenAI({
    baseURL: GROQ_BASE_URL,
    apiKey,
  })

export function createPrimaryModel(apiKey: string) {
  return groq(apiKey).chat("llama-3.3-70b-versatile")
}

export function createFallbackModel(apiKey: string) {
  return groq(apiKey).chat("llama-3.1-8b-instant")
}

export function createPrimaryAdapter(apiKey: string) {
  return createPrimaryModel(apiKey)
}

export function createFallbackAdapter(apiKey: string) {
  return createFallbackModel(apiKey)
}
