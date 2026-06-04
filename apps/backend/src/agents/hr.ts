// Legacy — migrated to copilotkit-service/src/agents/hr.ts

// import { chat } from "@tanstack/ai"
// import { createPrimaryAdapter, createFallbackAdapter } from "../models"
// import { withRetry } from "../with-retry"
// import { logger } from "../logger"

// const HR_SYSTEM = `You are Kira's HR specialist agent. ...`

// async function callChat(prompt: string, systemPrompt: string, adapter: any): Promise<string> {
//   const result = chat({
//     adapter,
//     messages: [{ role: "user" as const, content: prompt }],
//     systemPrompts: [systemPrompt],
//     stream: false,
//   } as any)
//   return result as unknown as Promise<string>
// }

// async function generateWithFallback(systemPrompt: string, prompt: string): Promise<string> {
//     const apiKey = process.env.GROQ_API_KEY ?? ""
//   const adapters = [createPrimaryAdapter, createFallbackAdapter]
//   for (let attempt = 0; attempt < adapters.length; attempt++) {
//     const factory = adapters[attempt]
//     if (!factory) continue
//     try {
//       const text = await withRetry(
//         () => callChat(prompt, systemPrompt, factory(apiKey)),
//         { context: "hr-agent" },
//       )
//       return text
//     } catch (error) {
//       logger.error({ err: error, attempt }, "HR agent adapter failed")
//       if (attempt === adapters.length - 1) throw error
//     }
//   }
//   throw new Error("All HR agent models exhausted")
// }

// export async function hrAgent(query: string, context?: string): Promise<string> {
//   const systemPrompt = context
//     ? `${HR_SYSTEM}\n\nAdditional context from the orchestrator: ${context}`
//     : HR_SYSTEM
//   return generateWithFallback(systemPrompt, query)
// }
