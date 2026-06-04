// Legacy — migrated to copilotkit-service/src/agents/scheduling.ts

// import { chat } from "@tanstack/ai"
// import { createPrimaryAdapter, createFallbackAdapter } from "../models"
// import { withRetry } from "../with-retry"
// import { logger } from "../logger"

// const SCHEDULING_SYSTEM = `You are Kira's interview scheduling specialist. You handle:
// - Scheduling interviews between candidates and interviewers
// - Rescheduling existing interviews
// - Canceling interviews
// - Checking availability
// - Managing calendar conflicts
// - Coordinating multi-round interview processes
// For now, you operate in planning mode. When asked to schedule:
// 1. Confirm the meeting details (who, when, duration)
// 2. Propose time slots (mock availability)
// 3. Provide a confirmation summary
// 4. Suggest any preparation materials
// When Google Calendar integration is connected, you will execute actual scheduling operations. For now, provide detailed scheduling plans and confirmations.
// Format your responses clearly with date/time information prominently displayed.`

// export interface SchedulingParams {
//   action: "schedule" | "reschedule" | "cancel" | "list" | "check-availability"
//   candidateName?: string
//   interviewerName?: string
//   date?: string
//   time?: string
//   duration?: string
//   notes?: string
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
//         { context: "scheduling-agent" },
//       )
//       return text
//     } catch (error) {
//       logger.error({ err: error, attempt }, "Scheduling agent adapter failed")
//       if (attempt === adapters.length - 1) throw error
//     }
//   }
//   throw new Error("All scheduling agent models exhausted")
// }

// export async function schedulingAgent(
//   params: SchedulingParams,
//   context?: string,
// ): Promise<string> {
//   const { action, candidateName, interviewerName, date, time, duration, notes } = params
//   const details: string[] = []
//   if (candidateName) details.push(`Candidate: ${candidateName}`)
//   if (interviewerName) details.push(`Interviewer: ${interviewerName}`)
//   if (date) details.push(`Date: ${date}`)
//   if (time) details.push(`Time: ${time}`)
//   if (duration) details.push(`Duration: ${duration}`)
//   if (notes) details.push(`Notes: ${notes}`)
//   const contextMsg = details.length
//     ? `\n\nMeeting details:\n${details.map((d) => `- ${d}`).join("\n")}`
//     : ""
//   const systemPrompt = [
//     SCHEDULING_SYSTEM,
//     context ? `\n\nContext from previous conversation:\n${context}` : "",
//   ].join("")
//   const prompt = `Action: ${action}${contextMsg}`
//   return generateWithFallback(systemPrompt, prompt)
// }
