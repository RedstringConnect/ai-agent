"use client"

import { useState, useEffect, useRef } from "react"

const PROMPTS = [
  "Find me a senior React developer with 5+ years experience",
  "Schedule interviews for next week with shortlisted candidates",
  "Create a job posting for a backend engineer",
  "Compare benefits plans across providers",
  "Generate an offer letter for a new hire",
  "Review our parental leave policy for compliance",
  "Find candidates available for immediate joining",
  "Draft a performance review template",
  "Search for UX designers in the healthcare domain",
  "Calculate total compensation for a senior role",
  "Set up onboarding tasks for a new employee",
  "Analyze our hiring pipeline for engineering roles",
]

const TYPING_SPEED = 35
const DELETING_SPEED = 20
const PAUSE_AFTER_TYPING = 2500
const PAUSE_AFTER_DELETING = 400

export function useTypewriterPlaceholder() {
  const [placeholder, setPlaceholder] = useState("")
  const promptIndexRef = useRef(0)
  const charIndexRef = useRef(0)
  const isDeletingRef = useRef(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    function tick() {
      const fullText = PROMPTS[promptIndexRef.current]!

      if (!isDeletingRef.current) {
        if (charIndexRef.current < fullText.length) {
          charIndexRef.current++
          setPlaceholder(fullText.slice(0, charIndexRef.current))
          timer = setTimeout(tick, TYPING_SPEED)
        } else {
          timer = setTimeout(() => {
            isDeletingRef.current = true
            tick()
          }, PAUSE_AFTER_TYPING)
        }
      } else {
        if (charIndexRef.current > 0) {
          charIndexRef.current--
          setPlaceholder(fullText.slice(0, charIndexRef.current))
          timer = setTimeout(tick, DELETING_SPEED)
        } else {
          promptIndexRef.current = (promptIndexRef.current + 1) % PROMPTS.length
          isDeletingRef.current = false
          timer = setTimeout(tick, PAUSE_AFTER_DELETING)
        }
      }
    }

    timer = setTimeout(tick, PAUSE_AFTER_DELETING)
    return () => clearTimeout(timer)
  }, [])

  return { placeholder }
}
