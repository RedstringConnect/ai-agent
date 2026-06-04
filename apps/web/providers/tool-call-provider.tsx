"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type ToolCallStatus = "pending" | "executing" | "completed" | "failed"

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  status: ToolCallStatus
  result?: string
  error?: string
  durationMs?: number
  startedAt?: number
  completedAt?: number
}

interface ToolCallContextValue {
  calls: ToolCall[]
  addCall: (name: string, args: Record<string, unknown>) => string
  updateStatus: (id: string, status: ToolCallStatus, extra?: Partial<ToolCall>) => void
  clearCalls: () => void
}

const ToolCallContext = createContext<ToolCallContextValue | null>(null)

export function ToolCallProvider({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<ToolCall[]>([])

  const addCall = useCallback((name: string, args: Record<string, unknown>): string => {
    const id = crypto.randomUUID()
    setCalls((prev) => [
      ...prev,
      { id, name, args, status: "pending", startedAt: Date.now() },
    ])
    return id
  }, [])

  const updateStatus = useCallback(
    (id: string, status: ToolCallStatus, extra?: Partial<ToolCall>) => {
      setCalls((prev) =>
        prev.map((call) =>
          call.id === id
            ? {
                ...call,
                ...extra,
                status,
                ...(status === "executing" ? { startedAt: Date.now() } : {}),
                ...(status === "completed" || status === "failed"
                  ? { completedAt: Date.now(), durationMs: Date.now() - (call.startedAt ?? Date.now()) }
                  : {}),
              }
            : call,
        ),
      )
    },
    [],
  )

  const clearCalls = useCallback(() => {
    setCalls([])
  }, [])

  return (
    <ToolCallContext.Provider value={{ calls, addCall, updateStatus, clearCalls }}>
      {children}
    </ToolCallContext.Provider>
  )
}

export function useToolCalls() {
  const ctx = useContext(ToolCallContext)
  if (!ctx) throw new Error("useToolCalls must be used within ToolCallProvider")
  return ctx
}
