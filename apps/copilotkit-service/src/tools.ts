import { dynamicTool } from "ai"
import { z } from "zod"
import { hrAgent } from "./agents/hr"
import { schedulingAgent } from "./agents/scheduling"
import { sourcingAgent } from "./agents/sourcing"
import { contextStore } from "./context-store"
import { loadSkillContent, type SkillMetadata } from "./skills"

export interface ToolContext {
  messages: any[]
  chatId?: string
}

export function createOrchestratorTools(
  skills: SkillMetadata[],
  getContext: () => ToolContext,
) {
  return {
    // Client-side tool: CopilotKit intercepts this before execute is called.
    // Uses dynamicTool + inputSchema (Zod v4 API for AI SDK v6).
    collectRequirements: dynamicTool({
      description:
        "Call this when you need structured information from the user. Generate specific questions to collect all needed details. VERY IMPORTANT: You MUST pass an array of question objects inside the 'questions' parameter. Never put 'type', 'question', or 'options' at the root level. Always wrap them in the 'questions' array, even if there is only one question. Example: { \"title\": \"Search\", \"description\": \"Need details\", \"questions\": [ { \"id\": \"q1\", \"question\": \"Location?\", \"type\": \"text\", \"options\": [], \"required\": true } ] }",
      inputSchema: z.object({
        title: z.string().describe("A short title for the form, e.g. 'Candidate Search Details'"),
        description: z.string().describe("Context explaining why this info is needed"),
        questions: z.array(
          z.object({
            id: z.string().describe("Unique identifier for this question"),
            question: z.string().describe("The text of the question to ask the user"),
            type: z.string().transform((val) => {
              const allowed = ["text", "single_select", "multi_select", "boolean"] as const
              return allowed.includes(val as (typeof allowed)[number])
                ? (val as (typeof allowed)[number])
                : "text"
            }).describe(
              "Type of input field. MUST be exactly one of: text, single_select, multi_select, boolean. Never use 'date', 'number', or any other type."
            ),
            options: z.array(z.string()).describe("Options for single_select and multi_select types. For text and boolean questions, provide an empty array []."),
            required: z.boolean().describe("Whether this question must be answered"),
          })
        ).describe("An array of question objects to ask the user. YOU MUST PASS THIS AS AN ARRAY OF OBJECTS."),
      }),
      execute: async () => {
        // CopilotKit intercepts this tool call client-side before execute runs.
        return "__client_side_tool__"
      },
    }),

    delegateHR: dynamicTool({
      description: "ONLY for specific HR policy details, benefits information, employee relations issues, or document generation (offer letters, relieving letters). Do NOT use for greetings or general conversation.",
      inputSchema: z.object({
        query: z.string().describe("A brief description of the user's HR-related request"),
      }),
      execute: async (input) => {
        const { query } = input as { query?: string }
        const { chatId } = getContext()
        const q = query ?? "User sent a request"
        const ctx = chatId ? contextStore.formatContextSummary(chatId) : undefined
        const result = await hrAgent(q, ctx)
        if (chatId) contextStore.appendToolResult(chatId, "delegateHR", result)
        // PHASE 4: Mitigate prompt injection by wrapping tool outputs
        return `<untrusted_user_input>\n${typeof result === 'string' ? result : JSON.stringify(result)}\n</untrusted_user_input>`
      },
    }),

    delegateSourcing: dynamicTool({
      description: "ONLY after collectRequirements has gathered structured filters. Search real candidates from the database by role, skills, location, and experience. Returns matching candidates with match scores. Do NOT call this directly — always call collectRequirements first.",
      inputSchema: z.object({
        role: z.string().describe("The job role or title to search for (e.g. 'Frontend Engineer', 'Data Scientist'). Be specific."),
        skills: z.array(z.string()).describe("Required skills (e.g. ['React', 'TypeScript', 'Python']). Can be empty.").optional(),
        location: z.string().describe("Desired location or region (e.g. 'San Francisco', 'Remote'). Can be empty.").optional(),
        experienceMin: z.number().describe("Minimum years of experience. Can be 0.").optional(),
        experienceMax: z.number().describe("Maximum years of experience. Can be omitted for no upper limit.").optional(),
      }),
      execute: async (input) => {
        const { role, skills, location, experienceMin, experienceMax } = input as {
          role?: string
          skills?: string[]
          location?: string
          experienceMin?: number
          experienceMax?: number
        }
        const { chatId } = getContext()
        const result = await sourcingAgent({ role, skills, location, experienceMin, experienceMax }, chatId)
        // PHASE 4: Mitigate prompt injection
        return `<untrusted_user_input>\n${typeof result === 'string' ? result : JSON.stringify(result)}\n</untrusted_user_input>`
      },
    }),

    delegateScheduling: dynamicTool({
      description: "For interview scheduling, rescheduling, cancellations, calendar operations.",
      inputSchema: z.object({
        query: z.string().describe("A brief description of the scheduling request"),
      }),
      execute: async (input) => {
        const { query } = input as { query?: string }
        const { chatId } = getContext()
        const q = query ?? "User sent a request"
        const ctx = chatId ? contextStore.formatContextSummary(chatId) : undefined
        const result = await schedulingAgent({ action: "schedule", notes: q }, ctx)
        if (chatId) contextStore.appendToolResult(chatId, "delegateScheduling", result)
        // PHASE 4: Mitigate prompt injection
        return `<untrusted_user_input>\n${typeof result === 'string' ? result : JSON.stringify(result)}\n</untrusted_user_input>`
      },
    }),

    loadSkill: dynamicTool({
      description: "Load a skill to get specialized instructions for a specific task. Call this when the user asks about a topic that matches an available skill's description.",
      inputSchema: z.object({
        name: z.string().describe("The skill name to load"),
      }),
      execute: async (input) => {
        const { name } = input as { name: string }
        const result = await loadSkillContent(name, skills)
        if ("error" in result) {
          return `<untrusted_user_input>\n${JSON.stringify(result)}\n</untrusted_user_input>`
        }
        // PHASE 4: Mitigate prompt injection
        return `<untrusted_user_input>\nLoaded skill '${name}':\n\n${result.content}\n</untrusted_user_input>`
      },
    }),
  }
}
