import { useMemo } from "react"
import { CopilotChatReasoningMessage, useRenderTool } from "@copilotkit/react-core/v2"
import { GenerativeUIRenderer } from "../generative-ui/generative-ui-renderer"
import { ArtifactBox } from "../artifact/artifact-box"

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

export function CustomMessage({ message }: { message: any }) {
  const content = typeof message?.content === "string" ? message.content : ""
  const { reasoning, response, isRunning } = useMemo(() => extractReasoning(content), [content])
  const toolCalls = message?.toolCalls ?? message?.tool_calls ?? []

  // Simple Markdown renderer placeholder. In a real app, use react-markdown
  const renderText = (text: string) => {
    if (!text) return null
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
        {text}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-3 py-4 ${message.role === "user" ? "items-end" : "items-start"}`}>
      {message.role === "user" ? (
        <div className="rounded-2xl bg-primary px-4 py-2 text-primary-foreground max-w-[80%]">
          {content}
        </div>
      ) : (
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
          {response && renderText(response)}

          {/* 3. Cards (Tool Invocations) */}
          {toolCalls.map((tc: any) => {
            if (tc.name === "renderUI" && tc.args) {
              return (
                <div key={tc.id} className="w-full my-2">
                  <GenerativeUIRenderer component={tc.args.component} props={tc.args.props} />
                </div>
              )
            }
            if (tc.name === "showArtifact" && tc.args) {
              return (
                <div key={tc.id} className="w-full my-2">
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
              // We only render a small pulsing state while it's active. The actual input is handled globally by useQuestions.
              return (
                <div key={tc.id} className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground my-2">
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
                  Answering questions...
                </div>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

export function CustomMessageList({ messages }: { messages: any[] }) {
  return (
    <div className="flex flex-col w-full h-full">
      {messages.map((m) => (
        <CustomMessage key={m.id} message={m} />
      ))}
    </div>
  )
}
