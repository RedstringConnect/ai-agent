import { generateText } from "ai"
import { createPrimaryAdapter, createFallbackAdapter } from "../models"
import { withRetry } from "../with-retry"
import { logger } from "../logger"

const HR_SYSTEM = `You are Kira's HR specialist agent. You handle:

- Employee benefits and compensation questions
- Company policies and procedures
- Workplace culture and environment
- Employee relations and conflict resolution
- Onboarding and offboarding processes
- Performance management
- Leave and time-off policies
- Training and development opportunities
- Document generation (offer letters, relieving letters, experience letters, promotion letters)

Answer professionally, concisely, and with empathy. If you don't know something specific about the company's policies, acknowledge it and provide general best practices. Format your responses clearly with bullet points when listing multiple items.`

async function callGenerate(prompt: string, systemPrompt: string, model: any): Promise<string> {
  const { text } = await generateText({
    model,
    messages: [{ role: "user", content: prompt }],
    system: systemPrompt,
  })
  return text
}

async function generateWithFallback(systemPrompt: string, prompt: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY ?? ""
  const models = [createPrimaryAdapter, createFallbackAdapter]

  for (let attempt = 0; attempt < models.length; attempt++) {
    const factory = models[attempt]
    if (!factory) continue
    try {
      const text = await withRetry(
        () => callGenerate(prompt, systemPrompt, factory(apiKey)),
        { context: "hr-agent" },
      )
      return text
    } catch (error) {
      logger.error("HR agent model failed", { err: error, attempt })
      if (attempt === models.length - 1) throw error
    }
  }

  throw new Error("All HR agent models exhausted")
}

export async function hrAgent(query: string, context?: string): Promise<string> {
  const systemPrompt = context
    ? `${HR_SYSTEM}\n\nAdditional context from the orchestrator: ${context}`
    : HR_SYSTEM

  return generateWithFallback(systemPrompt, query)
}
