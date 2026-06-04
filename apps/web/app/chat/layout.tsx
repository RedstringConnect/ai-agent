import type { ReactNode } from "react"
import type { Metadata } from "next"
import { SidebarShell } from "@/providers/sidebar-provider"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@workspace/ui/components/sidebar"
import { CopilotKit } from "@copilotkit/react-core/v2"
import { ArtifactProvider } from "@/providers/artifact-provider"
import { QuestionsProvider } from "@/providers/questions-provider"
import { ReasoningProvider } from "@/providers/reasoning-provider"
import { ToolCallProvider } from "@/providers/tool-call-provider"
import { HitlProvider } from "@/providers/hitl-provider"
import { ErrorBoundary } from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "Kira — AI HR Assistant",
  description: "Your AI-powered HR assistant for hiring, onboarding, and people management.",
}

export default function ChatLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <CopilotKit runtimeUrl="/copilotkit" useSingleEndpoint={false}>
      <ArtifactProvider>
        <QuestionsProvider>
          <ReasoningProvider>
            <ToolCallProvider>
              <HitlProvider>
                <SidebarShell>
                <AppSidebar />
                <SidebarInset>
                  <header className="flex h-12 items-center gap-2 border-b px-4">
                    <SidebarTrigger />
                  </header>
                  <main className="flex-1">
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </main>
                </SidebarInset>
              </SidebarShell>
              </HitlProvider>
            </ToolCallProvider>
          </ReasoningProvider>
        </QuestionsProvider>
      </ArtifactProvider>
    </CopilotKit>
  )
}
