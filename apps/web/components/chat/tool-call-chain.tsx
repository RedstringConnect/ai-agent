"use client"

import { useToolCalls } from "@/providers/tool-call-provider"
import { ToolCallCard } from "./tool-call-card"

export function ToolCallChain() {
  const { calls } = useToolCalls()

  if (calls.length === 0) return null

  return (
    <div className="my-3 space-y-1.5">
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Tool Calls
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          ({calls.filter((c) => c.status === "completed").length}/{calls.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {calls.map((call, i) => (
          <div key={call.id} className="relative">
            {i < calls.length - 1 && (
              <div className="absolute left-[17px] top-[34px] bottom-0 w-px bg-border" />
            )}
            <ToolCallCard call={call} index={i} isLast={i === calls.length - 1} />
          </div>
        ))}
      </div>
    </div>
  )
}
