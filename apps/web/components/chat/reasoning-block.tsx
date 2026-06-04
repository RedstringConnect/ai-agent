"use client"

import { useState, useEffect } from "react"
import { useReasoning } from "@/providers/reasoning-provider"

export function ReasoningBlock() {
  const { reasoning, isThinking } = useReasoning()
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    if (isThinking) setIsExpanded(true)
  }, [isThinking])

  if (!reasoning && !isThinking) return null

  return (
    <div className="mb-2 rounded-lg border border-muted bg-muted/30">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className={`inline-block size-1.5 rounded-full ${isThinking ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
        <span>{isThinking ? "Thinking..." : "Thought about this"}</span>
        <svg
          className={`ml-auto size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isExpanded && (
        <div className="border-t border-muted px-3 py-2">
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {reasoning}
            {isThinking && <span className="inline-block ml-0.5 animate-pulse">|</span>}
          </p>
        </div>
      )}
    </div>
  )
}
