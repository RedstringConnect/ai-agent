import { Suspense } from "react"
import { ChatView } from "./chat-view"

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ChatView />
    </Suspense>
  )
}
