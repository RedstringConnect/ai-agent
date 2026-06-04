"use client"

import { useEffect, useRef } from "react"
import type { CatalogueEntry } from "backend"

interface AgentDetailDialogProps {
  entry: CatalogueEntry
  onClose: () => void
}

export function AgentDetailDialog({ entry, onClose }: AgentDetailDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{entry.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {entry.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {entry.tools.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tools</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {entry.tools.map((tool) => (
                <span key={tool} className="rounded-md border px-2 py-0.5 text-[11px] font-medium">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {entry.capabilities.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capabilities</h3>
            <ul className="mt-1.5 space-y-1">
              {entry.capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2">
          <a
            href={`/chat?skill=${encodeURIComponent(entry.name)}`}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Chat with {entry.name}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
