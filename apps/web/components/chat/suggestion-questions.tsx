"use client"

interface SuggestionQuestionsProps {
  onSubmit: (message: string) => void
  disabled?: boolean
}

const SUGGESTIONS = [
  "Find me a senior React developer with 5+ years experience",
  "Create a job posting for a backend engineer",
  "Schedule interviews for next week",
]

export function SuggestionQuestions({ onSubmit, disabled }: SuggestionQuestionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSubmit(question)}
          disabled={disabled}
          className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {question}
        </button>
      ))}
    </div>
  )
}
