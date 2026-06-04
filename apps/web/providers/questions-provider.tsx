"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface Question {
  id: string
  question: string
  type: "text" | "single_select" | "multi_select" | "boolean"
  options: string[]
  required: boolean
}

export type Answers = Record<string, string>

interface QuestionsContextValue {
  questions: Question[]
  currentIndex: number
  currentQuestion: Question | null
  answers: Answers
  isActive: boolean
  progress: string
  start: (questions: Question[], onComplete: (answers: Answers) => void) => void
  startWithPromise: (questions: Question[]) => Promise<Answers>
  answerCurrent: (value: string) => void
  reset: () => void
}

const QuestionsContext = createContext<QuestionsContextValue | null>(null)

export function QuestionsProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [onComplete, setOnComplete] = useState<((answers: Answers) => void) | null>(null)
  const [isActive, setIsActive] = useState(false)

  const start = useCallback((qs: Question[], complete: (answers: Answers) => void) => {
    setQuestions(qs)
    setCurrentIndex(0)
    setAnswers({})
    setOnComplete(() => complete)
    setIsActive(true)
  }, [])

  const startWithPromise = useCallback((qs: Question[]): Promise<Answers> => {
    return new Promise<Answers>((resolve) => {
      start(qs, resolve)
    })
  }, [start])

  const answerCurrent = useCallback((value: string) => {
    setAnswers((prev) => {
      const q = questions[currentIndex]
      if (!q) return prev
      const updated = { ...prev, [q.id]: value }
      const nextIndex = currentIndex + 1
      if (nextIndex >= questions.length) {
        setOnComplete((fn: ((answers: Answers) => void) | null) => {
          if (fn) {
            setTimeout(() => {
              fn(updated)
              setIsActive(false)
              setQuestions([])
              setCurrentIndex(0)
              setOnComplete(null)
            }, 0)
          }
          return null
        })
      } else {
        setCurrentIndex(nextIndex)
      }
      return updated
    })
  }, [questions, currentIndex])

  const reset = useCallback(() => {
    setIsActive(false)
    setQuestions([])
    setCurrentIndex(0)
    setAnswers({})
    setOnComplete(null)
  }, [])

  const currentQuestion = isActive && currentIndex < questions.length ? (questions[currentIndex] ?? null) : null
  const progress = isActive && questions.length > 0 ? `${currentIndex + 1}/${questions.length}` : ""

  return (
    <QuestionsContext.Provider
      value={{
        questions,
        currentIndex,
        currentQuestion,
        answers,
        isActive,
        progress,
        start,
        startWithPromise,
        answerCurrent,
        reset,
      }}
    >
      {children}
    </QuestionsContext.Provider>
  )
}

export function useQuestions() {
  const ctx = useContext(QuestionsContext)
  if (!ctx) throw new Error("useQuestions must be used within QuestionsProvider")
  return ctx
}
