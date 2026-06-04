import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kira — AI HR Assistant",
  description: "Your AI-powered HR assistant for hiring, onboarding, and people management.",
}

export default function RootPage() {
  redirect("/chat")
}
