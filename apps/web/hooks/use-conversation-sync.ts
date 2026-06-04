"use client"

import { useEffect, useRef } from "react"
import { useAgent } from "@copilotkit/react-core/v2"
import { trpc } from "@/lib/trpc/client"
import { useDebugLog } from "@/hooks/use-debug-log"

export function useConversationSync(conversationId: string) {
  const { log } = useDebugLog("useConversationSync")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { agent } = useAgent({ agentId: "default", updates: ["OnMessagesChanged" as any] })
  const utils = trpc.useUtils()

  const { data: conversation, isLoading } = trpc.conversations.getById.useQuery(
    { id: conversationId, includeMessages: true },
    { enabled: !!conversationId },
  )

  const { mutate: updateTitle } = trpc.conversations.update.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate()
    },
  })

  const restoredRef = useRef(false)
  const savedIdsRef = useRef<Set<string>>(new Set())
  const prevIdRef = useRef(conversationId)

  useEffect(() => {
    if (prevIdRef.current !== conversationId) {
      log("id changed", { from: prevIdRef.current, to: conversationId })
      prevIdRef.current = conversationId
      restoredRef.current = false
      savedIdsRef.current = new Set()
      
      try {
        if (agent) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(agent as any).setMessages([])
        }
      } catch (e) {
        log("failed to clear agent messages", e)
      }
    }
  }, [conversationId, agent, log])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = conversation as any
    log("restore effect", { hasData: !!c?.messages?.length, alreadyRestored: restoredRef.current, conversationId })
    if (!c?.messages?.length || restoredRef.current) return
    restoredRef.current = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMsgs = (agent as any)?.messages
    log("restore check", { currentMsgsCount: currentMsgs?.length })
    if (currentMsgs?.length) {
      log("skipping restore — agent already has messages (provisional ID path)")
      return
    }

    const dbMessages = c.messages as Array<{
      id: string
      role: "user" | "assistant"
      content: string
      createdAt?: string | Date
    }>

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(agent as any).setMessages(
        dbMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
        })),
      )
    } catch {
      /* agent may not be ready */
    }

    dbMessages.forEach((m) => savedIdsRef.current.add(m.id))
  }, [conversation, agent, conversationId, log])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentMessagesLength = (agent as any)?.messages?.length
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msgs = (agent as any)?.messages as
      | { id: string; role: "user" | "assistant" | "tool"; content: string; createdAt?: string }[]
      | undefined
    if (!msgs || msgs.length === 0) return

    const unsaved = msgs.filter((m) => !savedIdsRef.current.has(m.id))
    if (unsaved.length > 0) {
      const agentMessages = unsaved.filter((m) => m.role === "assistant" && m.content)

      const firstMsg = agentMessages[0]
      if (conversationId === "new" && firstMsg?.content) {
        log("updating title", firstMsg.content)
        updateTitle({ id: conversationId, title: firstMsg.content.slice(0, 60) })
      }
    }
    unsaved.forEach((m) => savedIdsRef.current.add(m.id))
  }, [agentMessagesLength, conversationId, log, updateTitle, agent])

  useEffect(() => {
    if (!conversationId) return

    const eventSource = new EventSource(`http://localhost:8788/api/chat/events?conversationId=${conversationId}`, {
      withCredentials: true,
    })
    
    eventSource.addEventListener("message.update", (e) => {
      log("SSE update received", e.data)
      utils.conversations.getById.invalidate({ id: conversationId })
    })

    return () => {
      eventSource.close()
    }
  }, [conversationId, utils, log])

  useEffect(() => {
    if (conversationId && conversation) {
      log("syncing agent messages with DB state")
    }
  }, [conversationId, conversation, log])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serverMessages = conversation && "messages" in conversation ? (conversation as any).messages : []
  return { isLoading, serverMessages }
}
