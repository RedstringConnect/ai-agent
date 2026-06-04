"use client"

import { useState, useRef, useCallback, type KeyboardEvent } from "react"
import { useQuestions } from "@/providers/questions-provider"

interface QuestionInputProps {
  onSubmit?: (message: string) => void
}

export function QuestionInput({ onSubmit }: QuestionInputProps) {
  const { currentQuestion, progress, answerCurrent } = useQuestions()
  const [inputValue, setInputValue] = useState("")
  const [selectedChips, setSelectedChips] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const q = currentQuestion

  const handleSubmit = useCallback(() => {
    if (!q) return

    if (q.type === "multi_select") {
      const custom = inputValue.trim()
      const all = custom ? [...selectedChips, custom] : selectedChips
      if (all.length === 0) return
      answerCurrent(all.join(", "))
    } else {
      const val = inputValue.trim()
      if (!val && q.required) return
      if (!val) {
        answerCurrent("")
        return
      }
      answerCurrent(val)
    }

    setInputValue("")
    setSelectedChips([])
  }, [q, selectedChips, inputValue, answerCurrent])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const isSingleSelect = q?.type === "single_select" || q?.type === "boolean"

  const toggleChip = useCallback((chip: string) => {
    if (isSingleSelect) {
      setInputValue(chip)
      setSelectedChips([])
    } else {
      setSelectedChips((prev) =>
        prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
      )
      setInputValue("")
    }
  }, [isSingleSelect])

  if (!q) return null

  const showCustomOption = q.type !== "boolean" && q.options.length > 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Question {progress}</span>
      </div>

      <p className="text-sm font-medium">{q.question}</p>

      {q.options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {q.options.map((opt) => {
            const isSelected =
              isSingleSelect
                ? inputValue === opt
                : selectedChips.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleChip(opt)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt}
              </button>
            )
          })}
          {showCustomOption && (
            <button
              type="button"
              onClick={() => {
                if (isSingleSelect) {
                  setInputValue("")
                  setSelectedChips([])
                }
                textareaRef.current?.focus()
              }}
              className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              + Type your own
            </button>
          )}
        </div>
      )}

      <div className="relative flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-primary/50 transition-all">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSingleSelect ? "Type your answer or select above..." : q.type === "multi_select" ? "Type a custom skill and press Enter..." : "Type your answer..."}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 scrollbar-thin"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={q.required && !inputValue.trim() && selectedChips.length === 0}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Submit answer"
        >
          <ArrowUpIcon />
        </button>
      </div>
    </div>
  )
}

function ArrowUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}
