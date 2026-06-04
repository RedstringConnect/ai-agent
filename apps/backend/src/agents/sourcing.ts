// Legacy — migrated to copilotkit-service/src/agents/sourcing.ts

// import { chat } from "@tanstack/ai"
// import { createPrimaryAdapter, createFallbackAdapter } from "../models"
// import { withRetry } from "../with-retry"
// import { logger } from "../logger"

// const SOURCING_SYSTEM = `You are Kira's candidate sourcing specialist. ...`
// export interface SourcingFilters {
//   role?: string
//   location?: string
//   skills?: string[]
//   experience?: string
// }

// async function generateWithFallback(systemPrompt: string, prompt: string): Promise<string> {
//   const apiKey = process.env.GROQ_API_KEY ?? ""
//   const adapters = [createPrimaryAdapter, createFallbackAdapter]
//   for (let attempt = 0; attempt < adapters.length; attempt++) {
//     const factory = adapters[attempt]
//     if (!factory) continue
//     try {
//       const text = await withRetry(
//         () => {
//           const result = chat({
//             adapter: factory(apiKey),
//             messages: [{ role: "user" as const, content: prompt }],
//             systemPrompts: [systemPrompt],
//             stream: false,
//           } as any)
//           return result as unknown as Promise<string>
//         },
//         { context: "sourcing-agent" },
//       )
//       return text
//     } catch (error) {
//       logger.error({ err: error, attempt }, "Sourcing agent adapter failed")
//       if (attempt === adapters.length - 1) throw error
//     }
//   }
//   throw new Error("All sourcing agent models exhausted")
// }

// export async function sourcingAgent(
//   query: string,
//   filters?: SourcingFilters,
//   context?: string,
// ): Promise<string> {
//   let filterContext = ""
//   if (filters) {
//     const parts: string[] = []
//     if (filters.role) parts.push(`Role: ${filters.role}`)
//     if (filters.location) parts.push(`Location: ${filters.location}`)
//     if (filters.skills?.length) parts.push(`Skills: ${filters.skills.join(", ")}`)
//     if (filters.experience) parts.push(`Experience: ${filters.experience}`)
//     if (parts.length) {
//       filterContext = `\n\nSearch filters provided:\n${parts.map((d) => `- ${d}`).join("\n")}`
//     }
//   }
//   const systemPrompt = [
//     SOURCING_SYSTEM,
//     context ? `\n\nContext from previous conversation:\n${context}` : "",
//   ].join("")
//   const prompt = `${query}${filterContext}\n\nReturn ONLY valid JSON. No markdown, no code fences, no extra text.`
//   return generateWithFallback(systemPrompt, prompt)
// }
