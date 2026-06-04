"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type HitlStatus = "idle" | "waiting_input" | "waiting_confirmation" | "approved" | "rejected" | "cancelled"

export interface HitlState {
  status: HitlStatus
  toolName: string | null
  reason: string | null
  args: Record<string, unknown> | null
}

interface HitlContextValue {
  state: HitlState
  requestConfirmation: (toolName: string, reason: string, args?: Record<string, unknown>) => void
  waitForInput: (toolName: string, reason: string) => void
  approve: () => void
  reject: () => void
  cancel: () => void
  reset: () => void
}

const HitlContext = createContext<HitlContextValue | null>(null)

export function HitlProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HitlState>({
    status: "idle",
    toolName: null,
    reason: null,
    args: null,
  })

  const requestConfirmation = useCallback(
    (toolName: string, reason: string, args?: Record<string, unknown>) => {
      setState({ status: "waiting_confirmation", toolName, reason, args: args ?? null })
    },
    [],
  )

  const waitForInput = useCallback((toolName: string, reason: string) => {
    setState({ status: "waiting_input", toolName, reason, args: null })
  }, [])

  const approve = useCallback(() => {
    setState((prev) => ({ ...prev, status: "approved" }))
  }, [])

  const reject = useCallback(() => {
    setState((prev) => ({ ...prev, status: "rejected" }))
  }, [])

  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, status: "cancelled" }))
  }, [])

  const reset = useCallback(() => {
    setState({ status: "idle", toolName: null, reason: null, args: null })
  }, [])

  return (
    <HitlContext.Provider
      value={{ state, requestConfirmation, waitForInput, approve, reject, cancel, reset }}
    >
      {children}
    </HitlContext.Provider>
  )
}

export function useHitl() {
  const ctx = useContext(HitlContext)
  if (!ctx) throw new Error("useHitl must be used within HitlProvider")
  return ctx
}
