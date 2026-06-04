"use client"

import { getComponent } from "./component-registry"

interface GenerativeUIRendererProps {
  component: string
  props: Record<string, unknown>
}

export function GenerativeUIRenderer({ component, props }: GenerativeUIRendererProps) {
  const Component = getComponent(component)

  if (!Component) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center text-xs text-muted-foreground">
        Unknown component: {component}
      </div>
    )
  }

  return <Component {...props} />
}
