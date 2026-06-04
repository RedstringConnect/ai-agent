"use client"

import type { ReactNode } from "react"
import { CandidatesTable } from "@/components/candidates-table"

export interface ComponentDefinition {
  component: string
  props: Record<string, unknown>
}

export interface RegistryComponent {
  name: string
  component: (props: Record<string, unknown>) => ReactNode
  schema?: Record<string, unknown>
}

const registry: RegistryComponent[] = [
  {
    name: "candidatesTable",
    component: (props) => <CandidatesTable candidates={props.candidates as any[] ?? []} />,
  },
  {
    name: "profileCard",
    component: (props) => (
      <div className="rounded-lg border p-4">
        <p className="font-medium">{String(props.name ?? "")}</p>
        <p className="text-sm text-muted-foreground">{String(props.role ?? "")}</p>
        {Array.isArray(props.skills) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(props.skills as string[]).map((s) => (
              <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    ),
  },
  {
    name: "infoCard",
    component: (props) => (
      <div className="rounded-lg border border-muted bg-muted/30 p-3">
        <p className="text-sm font-medium">{String(props.title ?? "")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{String(props.description ?? "")}</p>
      </div>
    ),
  },
  {
    name: "metricGrid",
    component: (props) => {
      const metrics = Array.isArray(props.metrics) ? props.metrics : []
      return (
        <div className="grid grid-cols-2 gap-2">
          {(metrics as Array<{ label: string; value: string }>).map((m) => (
            <div key={m.label} className="rounded-lg border p-3 text-center">
              <p className="text-lg font-bold">{m.value}</p>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      )
    },
  },
]

export function getComponent(name: string): ((props: Record<string, unknown>) => ReactNode) | undefined {
  return registry.find((c) => c.name === name)?.component
}
