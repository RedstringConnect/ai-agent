"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"

const TAG_START = "⟪reasoning⟫"
const TAG_END = "⟪/reasoning⟫"

export function extractReasoning(text: string): { reasoning: string; response: string } {
  const startIdx = text.indexOf(TAG_START)
  if (startIdx === -1) return { reasoning: "", response: text }

  const afterStart = startIdx + TAG_START.length
  const endIdx = text.indexOf(TAG_END, afterStart)
  if (endIdx === -1) {
    return { reasoning: text.slice(afterStart).trim(), response: "" }
  }

  const reasoning = text.slice(afterStart, endIdx).trim()
  const response = text.slice(endIdx + TAG_END.length).trim()
  return { reasoning, response }
}

interface ReasoningContextValue {
  currentText: string
  reasoning: string
  responseText: string
  isThinking: boolean
  pushChunk: (chunk: string) => void
  reset: () => void
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null)

export function ReasoningProvider({ children }: { children: ReactNode }) {
  const [currentText, setCurrentText] = useState("")
  const [reasoning, setReasoning] = useState("")
  const [responseText, setResponseText] = useState("")
  const bufferRef = useRef("")

  const pushChunk = useCallback((chunk: string) => {
    bufferRef.current += chunk
    const text = bufferRef.current

    const startIdx = text.indexOf(TAG_START)
    const endIdx = text.indexOf(TAG_END)

    if (startIdx === -1) {
      setResponseText(text)
      setReasoning("")
      setCurrentText(text)
      return
    }

    if (endIdx === -1) {
      const afterStart = startIdx + TAG_START.length
      setReasoning(text.slice(afterStart))
      setResponseText("")
      setCurrentText(text)
      return
    }

    const afterStart = startIdx + TAG_START.length
    const reason = text.slice(afterStart, endIdx).trim()
    const resp = text.slice(endIdx + TAG_END.length).trim()
    setReasoning(reason)
    setResponseText(resp)
    setCurrentText(text)
  }, [])

  const reset = useCallback(() => {
    bufferRef.current = ""
    setCurrentText("")
    setReasoning("")
    setResponseText("")
  }, [])

  const isThinking = currentText.length > 0 && currentText.includes(TAG_START) && !currentText.includes(TAG_END)

  return (
    <ReasoningContext.Provider
      value={{ currentText, reasoning, responseText, isThinking, pushChunk, reset }}
    >
      {children}
    </ReasoningContext.Provider>
  )
}

export function useReasoning() {
  const ctx = useContext(ReasoningContext)
  if (!ctx) throw new Error("useReasoning must be used within ReasoningProvider")
  return ctx
}
