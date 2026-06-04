"use client"

import { useHitl } from "@/providers/hitl-provider"

export function HitlConfirmation() {
  const { state, approve, reject, cancel } = useHitl()

  if (state.status === "idle" || state.status === "waiting_input") return null

  return (
    <div className="my-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 border-b border-amber-200/50 dark:border-amber-800/50 px-3 py-2">
        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
          {state.status === "waiting_confirmation" ? "Awaiting your confirmation" : state.status === "approved" ? "Approved" : state.status === "rejected" ? "Rejected" : "Cancelled"}
        </span>
        {state.status === "waiting_confirmation" && (
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-amber-500" />
        )}
      </div>
      <div className="px-3 py-2 space-y-2">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">{state.toolName}</p>
          <p className="text-xs text-muted-foreground">{state.reason}</p>
        </div>
        {state.args && Object.keys(state.args).length > 0 && (
          <pre className="rounded bg-amber-100/50 dark:bg-amber-900/20 p-1.5 text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
            {JSON.stringify(state.args, null, 1)}
          </pre>
        )}
        {state.status === "waiting_confirmation" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={approve}
              className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={reject}
              className="rounded-md border border-amber-300 dark:border-amber-700 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
