import { useMemo } from "react"
import { CopilotChatReasoningMessage } from "@copilotkit/react-core/v2"
import { GenerativeUIRenderer } from "../generative-ui/generative-ui-renderer"
import { ArtifactBox } from "../artifact/artifact-box"
import { Turn } from "@/lib/message-grouping"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const OPEN_TAG = "⟪reasoning⟫"
const CLOSE_TAG = "⟪/reasoning⟫"

function extractReasoning(content: string): { reasoning: string | null; response: string; isRunning: boolean } {
  const trimmed = content.trimStart()
  
  let startIdx = content.indexOf(OPEN_TAG)
  let openLen = OPEN_TAG.length
  
  // Fallback for LLMs outputting standard XML tags
  if (startIdx === -1) {
    startIdx = content.indexOf("<reasoning>")
    openLen = "<reasoning>".length
  }
  
  if (startIdx === -1) {
    if ((trimmed.startsWith("⟪") && OPEN_TAG.startsWith(trimmed)) || (trimmed.startsWith("<") && "<reasoning>".startsWith(trimmed))) {
      return { reasoning: "", response: "", isRunning: true }
    }
    return { reasoning: null, response: content, isRunning: false }
  }
  
  const reasoningStart = startIdx + openLen
  
  // Look for exact or common fallback closing tags
  let closeIdx = content.indexOf(CLOSE_TAG, reasoningStart)
  let closeLen = CLOSE_TAG.length
  
  if (closeIdx === -1) {
    closeIdx = content.indexOf("</reasoning>", reasoningStart)
    closeLen = "</reasoning>".length
  }
  
  // If no closing tag is found, everything after open tag is reasoning
  if (closeIdx === -1) {
    const partial = content.slice(reasoningStart).trimStart()
    return { reasoning: partial, response: "", isRunning: true }
  }
  
  const reasoning = content.slice(reasoningStart, closeIdx).trim()
  const response = content.slice(closeIdx + closeLen).trimStart()
  
  // Clean up any stray trailing brackets if the LLM messed up the close tag formatting
  const cleanResponse = response.replace(/^⟫\s*/, "").replace(/^>\s*/, "")
  
  return { reasoning, response: cleanResponse, isRunning: false }
}

function SubMessage({ message }: { message: any }) {
  const content = typeof message?.content === "string" ? message.content : ""
  const { reasoning, response, isRunning } = useMemo(() => extractReasoning(content), [content])
  const toolCalls = message?.toolCalls ?? message?.tool_calls ?? []

  if (message.role === "tool" || message.role === "function") {
    // We don't directly render tool results in the chat stream, 
    // the LLM's next response will summarize it.
    return null
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. Reasoning UI */}
      {reasoning !== null && (
        <CopilotChatReasoningMessage
          message={{
            id: `${message.id}-reasoning`,
            role: "reasoning",
            content: reasoning,
          }}
          isRunning={isRunning}
        />
      )}

      {/* 2. Text Content */}
      {response && (
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {response}
          </ReactMarkdown>
        </div>
      )}

      {/* 3. Cards & Tools */}
      {toolCalls.map((tc: any) => {
        // Handle Frontend A2UI rendering
        if (tc.name === "renderUI" && tc.args) {
          return (
            <div key={tc.id} className="w-full my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <GenerativeUIRenderer component={tc.args.component} props={tc.args.props} />
            </div>
          )
        }
        if (tc.name === "showArtifact" && tc.args) {
          return (
            <div key={tc.id} className="w-full my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ArtifactBox
                artifact={{
                  type: tc.args.type,
                  title: tc.args.title,
                  data: tc.args.data,
                }}
              />
            </div>
          )
        }
        if (tc.name === "collectRequirements") {
          // This is a frontend tool. It will wait for the user to submit the form.
          // The actual form is rendered by useQuestions in chat-view.tsx, but we can show an indicator here.
          return (
            <div key={tc.id} className="flex items-center gap-2 px-3 py-2 text-sm text-primary bg-primary/10 rounded-md my-2 animate-pulse">
              <div className="size-2 rounded-full bg-primary" />
              Waiting for user input...
            </div>
          )
        }
        
        // Handle Backend Agent tools (Loading states)
        const isBackendTool = ["delegateSourcing", "delegateHR", "delegateScheduling"].includes(tc.name)
        if (isBackendTool) {
          // If there is no result yet, it's executing.
          const isExecuting = !tc.result && !tc.error
          if (isExecuting) {
            return (
              <div key={tc.id} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md my-2 border">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Agent is running {tc.name}...
              </div>
            )
          }
        }
        
        return null
      })}
    </div>
  )
}

export function AgenticTurn({ turn }: { turn: Turn }) {
  if (turn.type === "user") {
    return (
      <div className="flex w-full justify-end py-4">
        <div className="rounded-2xl bg-primary px-4 py-2 text-primary-foreground max-w-[80%]">
          {typeof turn.message.content === "string" ? turn.message.content : ""}
        </div>
      </div>
    )
  }

  // Agent turn: Group all assistant/tool messages into one cohesive block
  return (
    <div className="flex w-full justify-start py-4">
      <div className="flex flex-col gap-3 w-full max-w-[90%]">
        {turn.messages.map((m) => (
          <SubMessage key={m.id} message={m} />
        ))}
      </div>
    </div>
  )
}
