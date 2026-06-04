"use client"

import { useState } from "react"
import { AgentDetailDialog } from "./agent-detail-dialog"
import type { CatalogueEntry } from "backend"

interface AgentCardProps {
  entry: CatalogueEntry
}

const TYPE_LABELS: Record<string, string> = {
  skill: "System Skill",
  agent: "Specialist Agent",
}

const TYPE_COLORS: Record<string, string> = {
  skill: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  agent: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
}

export function AgentCard({ entry }: AgentCardProps) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <>
      <div className="group relative rounded-lg border bg-background p-4 transition-colors hover:border-muted-foreground/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium truncate">{entry.name}</h3>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[entry.type] ?? ""}`}>
                {TYPE_LABELS[entry.type] ?? entry.type}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {entry.description}
            </p>
          </div>
        </div>

        {entry.capabilities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {entry.capabilities.slice(0, 4).map((cap) => (
              <span
                key={cap}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {cap}
              </span>
            ))}
            {entry.capabilities.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{entry.capabilities.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDetail(true)}
            className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View details
          </button>
        </div>
      </div>

      {showDetail && (
        <AgentDetailDialog entry={entry} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}
