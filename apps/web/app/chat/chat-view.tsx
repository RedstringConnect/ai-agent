"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useAgent, useFrontendTool, useRenderTool, type UseAgentUpdate } from "@copilotkit/react-core/v2"
import { z } from "zod"
import { useArtifact } from "@/providers/artifact-provider"
import { ArtifactSplitView } from "@/components/artifact/artifact-split-view"
import { Group, Panel, Separator } from "react-resizable-panels"
import { useQuestions, type Question } from "@/providers/questions-provider"
import { useConversationSync } from "@/hooks/use-conversation-sync"
import { ChatInput } from "@/components/chat/chat-input"
import { QuestionInput } from "@/components/chat/question-input"
import { SuggestionQuestions } from "@/components/chat/suggestion-questions"
import { useDebugLog } from "@/hooks/use-debug-log"
import { ToolCallChain } from "@/components/chat/tool-call-chain"
import { HitlConfirmation } from "@/components/chat/hitl-confirmation"
import { useHitl } from "@/providers/hitl-provider"
import { useToolCalls } from "@/providers/tool-call-provider"
import { groupMessagesByTurn } from "@/lib/message-grouping"
import { AgenticTurn } from "@/components/chat/agentic-turn"


function UnifiedInput({ onSubmit }: { onSubmit: (msg: string) => void }) {
  const { isActive } = useQuestions()

  if (isActive) {
    return <QuestionInput />
  }

  return <ChatInput onSubmit={onSubmit} />
}

function useHiddenBackendToolCalls() {
  useRenderTool({ name: "loadSkill", parameters: z.object({}), render: () => <></> }, [])
  useRenderTool({ name: "delegateHR", parameters: z.object({}), render: () => <></> }, [])
  useRenderTool({ name: "delegateSourcing", parameters: z.object({}), render: () => <></> }, [])
  useRenderTool({ name: "delegateScheduling", parameters: z.object({}), render: () => <></> }, [])
}

// Stable component used by useRenderTool — defined OUTSIDE ChatView so its reference
// never changes across parent re-renders, preventing spurious remount/reset cycles.
const COLLECT_REQUIREMENTS_SCHEMA = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      type: z.string().transform((val) => {
        const allowed = ["text", "single_select", "multi_select", "boolean"] as const
        return (allowed as readonly string[]).includes(val)
          ? (val as (typeof allowed)[number])
          : "text"
      }),
      options: z.array(z.string()),
      required: z.boolean(),
    })
  ).optional(),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CollectRequirementsRenderer(props: any) {
  const { startWithPromise } = useQuestions()
  const { waitForInput } = useHitl()
  const started = useRef(false)

  useEffect(() => {
    const questions = props?.args?.questions as Question[] | undefined
    if (!Array.isArray(questions) || questions.length === 0) return
    if (started.current) return
    started.current = true
    waitForInput("collectRequirements", "Collecting information from you")
    startWithPromise(questions).then(() => {
      // answers are handled inside QuestionsProvider; no action needed here
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.args?.questions?.length])

  return <></>
}

// Subscribe to live agent messages reactively (no polling)
function useStreamingMessages() {
  // "OnMessagesChanged" fires on every streaming token and tool call update
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { agent } = useAgent({ agentId: "default", updates: ["OnMessagesChanged" as UseAgentUpdate] })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (agent as any)?.messages ?? []
}

export function ChatView() {
  const searchParams = useSearchParams()
  const { log } = useDebugLog("ChatView")
  const urlId = searchParams.get("id")
  const [activeId, setActiveId] = useState<string | null>(urlId)
  const { isOpen } = useArtifact()
  // agent for imperative actions (addMessage, runAgent)
  const { agent } = useAgent({ agentId: "default" })
  // live reactive messages from the streaming agent
  const messages = useStreamingMessages()
  const pendingMessage = useRef<string | null>(null)
  const { clearCalls } = useToolCalls()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (pendingMessage.current && activeId) {
      const msg = pendingMessage.current
      pendingMessage.current = null

      setTimeout(() => {
        const msgId = crypto.randomUUID()
        log("addMessage", { msgId })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(agent as any).addMessage({
          id: msgId,
          role: "user",
          content: msg,
          createdAt: new Date().toISOString(),
        })

        log("runAgent")
        clearCalls()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(agent as any).runAgent()
      }, 50)
    }
  }, [activeId, agent, clearCalls, log])

  useEffect(() => {
    log("url sync", { id: urlId, prev: activeId })
    if (urlId !== activeId) {
      setTimeout(() => setActiveId(urlId), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId])

  // Retrieve server-authoritative state via SSE hydration hook
  const { serverMessages } = useConversationSync(activeId ?? "")
  useHiddenBackendToolCalls()

  // Single source of truth: use live agent messages while streaming, server messages for history
  const displayMessages = useMemo(() => {
    // If the agent has messages (streaming or just streamed), always prefer those.
    // serverMessages are only used on initial load before the agent has any state.
    if (messages.length > 0) return messages
    return serverMessages
  }, [messages, serverMessages])

  log("render", { activeId, serverCount: serverMessages.length, streamCount: messages.length })

  async function handleSubmit(message: string) {
    const id = crypto.randomUUID()
    log("submit", { message, id })

    pendingMessage.current = message
    setActiveId(id)
    window.history.replaceState(null, "", `/chat?id=${id}`)
  }

  // useRenderTool intercepts the server-side collectRequirements call and triggers the UI.
  // The render component is stable (defined outside) so it never remounts spuriously.
  useRenderTool({
    name: "collectRequirements",
    parameters: COLLECT_REQUIREMENTS_SCHEMA,
    render: CollectRequirementsRenderer,
  }, [])

  // useFrontendTool registers collectRequirements as a client-side tool (handler-only).
  // This covers the case where the tool arrives from the client tools list
  // and needs to return answers to the agent.
  const { startWithPromise } = useQuestions()
  useFrontendTool({
    name: "collectRequirements",
    description:
      "Call this when you need structured information from the user. Present specific questions one at a time in the input area.",
    parameters: COLLECT_REQUIREMENTS_SCHEMA,
    handler: useCallback(async (args: any) => {
      const questions = (args?.questions ?? []) as Question[]
      if (!questions.length) return "{}"
      const answers = await startWithPromise(questions)
      return JSON.stringify(answers)
    }, [startWithPromise]),
  }, [startWithPromise])

  if (!activeId) {
    return (
      <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-8 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            <span className="text-primary">Kira</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Your AI-powered HR assistant
          </p>
        </div>

        <div className="w-full">
          <ChatInput onSubmit={handleSubmit} />
        </div>

        <SuggestionQuestions onSubmit={handleSubmit} />
      </div>
    )
  }

  const groupedTurns = groupMessagesByTurn(displayMessages)

  return (
    <div className="flex h-full">
      <Group orientation="horizontal" className="flex-1">
        <Panel defaultSize={isOpen ? 60 : 100} minSize={40}>
          <div className="flex h-full flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scroll-smooth">
              <ToolCallChain />
              <HitlConfirmation />
              
              <div className="flex flex-col w-full h-full pb-8">
                {groupedTurns.map((turn) => (
                  <AgenticTurn key={turn.id} turn={turn} />
                ))}
              </div>
            </div>
            <div className="w-full px-4 py-4 shrink-0">
              <UnifiedInput onSubmit={handleSubmit} />
            </div>
          </div>
        </Panel>
        {isOpen && (
          <>
            <Separator />
            <Panel defaultSize={40} minSize={20}>
              <ArtifactSplitView />
            </Panel>
          </>
        )}
      </Group>
    </div>
  )
}
