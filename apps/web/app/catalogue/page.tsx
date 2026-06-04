"use client"

import { trpc } from "@/lib/trpc/client"
import { AgentCard } from "@/components/catalogue/agent-card"
import { useState } from "react"

export default function CataloguePage() {
  const { data: entries, isLoading } = trpc.catalogue.list.useQuery()
  const [filter, setFilter] = useState<"all" | "skill" | "agent">("all")

  const filtered = entries?.filter((e) => filter === "all" || e.type === filter) ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Catalogue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse available skills and specialist agents
        </p>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {(["all", "skill", "agent"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "All" : f === "skill" ? "System Skills" : "Specialist Agents"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border bg-muted/30" />
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No entries found</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((entry) => (
            <AgentCard key={entry.name} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
