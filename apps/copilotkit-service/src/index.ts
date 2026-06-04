import "dotenv/config"
import { serve } from "@hono/node-server"
import { createCopilotHonoHandler } from "@copilotkit/runtime/v2/hono"
import { CopilotRuntime, BuiltInAgent, convertMessagesToVercelAISDKMessages } from "@copilotkit/runtime/v2"
import { streamText, dynamicTool, stepCountIs } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { logger } from "./logger"
import { ORCHESTRATOR_SYSTEM } from "./prompts"
import { createOrchestratorTools } from "./tools"
import { discoverSkills, buildSkillsPrompt, loadSkillContent } from "./skills"

const GROQ_API_KEY = process.env.GROQ_API_KEY

if (!GROQ_API_KEY) {
  logger.error("GROQ_API_KEY environment variable is required")
  process.exit(1)
}

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: GROQ_API_KEY,
})

const skills = discoverSkills()
const skillsPrompt = buildSkillsPrompt(skills)

const orchestratorRules = loadSkillContent("orchestrator-rules", skills)
const orchestratorRulesContent = "content" in orchestratorRules ? orchestratorRules.content : ""
const fullSystemPrompt = [ORCHESTRATOR_SYSTEM, orchestratorRulesContent, skillsPrompt].filter(Boolean).join("\n")

function convertFrontendTools(frontendTools: Array<{ name: string; description: string; parameters: any }>) {
  const result: Record<string, any> = {}
  for (const t of frontendTools) {
    result[t.name] = dynamicTool({
      description: t.description,
      inputSchema: {
        type: "object",
        properties: t.parameters?.properties ?? {},
        required: t.parameters?.required ?? [],
      } as any,
      execute: async () => "__frontend__",
    })
  }
  return result
}

const agent = new BuiltInAgent({
  type: "aisdk" as any,
  factory: async ({ input, abortSignal }: any) => {
    logger.info("agent factory invoked", { messageCount: input.messages?.length })
    if (abortSignal?.aborted) {
      logger.warn("abortSignal already aborted")
    }
    const vercelMessages = convertMessagesToVercelAISDKMessages(input.messages)
    const executionContext = { messages: input.messages, chatId: input.threadId }
    
    logger.info("incoming tools", { 
      toolsCount: input.tools?.length, 
      toolNames: input.tools?.map((t: any) => t.name) 
    })

    const frontendTools = convertFrontendTools(input.tools ?? [])
    const serverTools = createOrchestratorTools(skills, () => executionContext)
    const result = streamText({
      model: groq.chat("llama-3.3-70b-versatile"),
      system: fullSystemPrompt,
      messages: vercelMessages,
      tools: { ...frontendTools, ...serverTools },
      abortSignal,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'run-orchestrator',
        metadata: {
          threadId: input.threadId,
        }
      },
      stopWhen: stepCountIs(5),
      onStepFinish: async (event) => {
        logger.info("AI Step Finished", { toolCalls: event.toolCalls?.map(t => t.toolName) })
        // PHASE 1: Asynchronous persistence of partial tool calls and messages to the DB
        try {
          await fetch("http://localhost:8788/api/internal/save-chunk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              threadId: input.threadId,
              text: event.text,
              toolCalls: event.toolCalls,
              toolResults: event.toolResults,
            }),
          }).catch(() => { /* Fire and forget, retry logic goes here */ })
        } catch (e) {
          logger.error("Failed to persist step chunk", { error: e })
        }
      },
      onFinish: async (event) => {
        logger.info("AI Stream Finished", { finishReason: event.finishReason })
        // PHASE 1: Finalize stream in the database
        try {
          await fetch("http://localhost:8788/api/internal/finalize-stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              threadId: input.threadId,
              finalText: event.text,
            }),
          }).catch(() => {})
        } catch (e) {
          logger.error("Failed to finalize stream", { error: e })
        }
      },
    })
    logger.info("streamText created")
    return result
  },
})


const runtime = new CopilotRuntime({
  agents: { default: agent },
})

const app = createCopilotHonoHandler({ runtime, basePath: "/copilotkit" })

const port = Number(process.env.PORT) || 3002

serve({ fetch: app.fetch, port }, (info: any) => {
  logger.info("CopilotKit service running")
})
