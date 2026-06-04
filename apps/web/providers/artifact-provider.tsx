"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface Artifact {
  type: "candidates" | "document" | "code"
  title: string
  data: unknown
}

interface ArtifactContextValue {
  artifact: Artifact | null
  isOpen: boolean
  expand: (artifact: Artifact) => void
  collapse: () => void
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null)

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const expand = useCallback((a: Artifact) => {
    setArtifact(a)
    setIsOpen(true)
  }, [])

  const collapse = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <ArtifactContext.Provider value={{ artifact, isOpen, expand, collapse }}>
      {children}
    </ArtifactContext.Provider>
  )
}

export function useArtifact() {
  const ctx = useContext(ArtifactContext)
  if (!ctx) throw new Error("useArtifact must be used within ArtifactProvider")
  return ctx
}
