"use client"

import { useState } from "react"
import type { ToolCall } from "@/providers/tool-call-provider"

interface ToolCallCardProps {
  call: ToolCall
  index: number
  isLast: boolean
}

const TOOL_ICONS: Record<string, string> = {
  delegateHR: "user",
  delegateSourcing: "search",
  delegateScheduling: "calendar",
  loadSkill: "book",
  collectRequirements: "form",
  showArtifact: "eye",
  renderUI: "layout",
}

function ToolIcon({ name }: { name: string }) {
  const icon = TOOL_ICONS[name] ?? "tool"
  return (
    <span className="flex size-5 items-center justify-center rounded bg-muted-foreground/10 text-[10px] font-medium text-muted-foreground uppercase">
      {icon[0]}
    </span>
  )
}

function StatusDot({ status }: { status: ToolCall["status"] }) {
  switch (status) {
    case "pending":
      return <span className="size-2 rounded-full bg-muted-foreground/30" />
    case "executing":
      return <span className="size-2 animate-pulse rounded-full bg-primary" />
    case "completed":
      return <span className="size-2 rounded-full bg-emerald-500" />
    case "failed":
      return <span className="size-2 rounded-full bg-red-500" />
  }
}

function formatArgs(args: Record<string, unknown>): string {
  try {
    const entries = Object.entries(args).filter(([, v]) => v !== undefined && v !== "")
    if (entries.length === 0) return ""
    return entries
      .map(([k, v]) => {
        const val = Array.isArray(v)
          ? `[${(v as string[]).join(", ")}]`
          : String(v)
        return `${k}: ${val.length > 60 ? val.slice(0, 60) + "..." : val}`
      })
      .join(" | ")
  } catch {
    return ""
  }
}

export function ToolCallCard({ call, index, isLast }: ToolCallCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const argsStr = formatArgs(call.args)
  const hasDetails = call.result || call.error

  return (
    <div className="relative">
      <div className="flex items-start gap-2 rounded-md border border-muted bg-background px-2.5 py-2">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <ToolIcon name={call.name} />
          <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">{call.name}</span>
            {call.durationMs !== undefined && call.durationMs > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {(call.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          {argsStr && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {argsStr}
            </p>
          )}
          {hasDetails && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="mt-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
          )}
          {showDetails && call.result && (
            <pre className="mt-1 max-h-24 overflow-y-auto rounded bg-muted/50 p-1.5 text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
              {call.result}
            </pre>
          )}
          {showDetails && call.error && (
            <pre className="mt-1 max-h-24 overflow-y-auto rounded bg-red-50 p-1.5 text-[10px] text-red-600 whitespace-pre-wrap break-all">
              {call.error}
            </pre>
          )}
        </div>
        <StatusDot status={call.status} />
      </div>
    </div>
  )
}
