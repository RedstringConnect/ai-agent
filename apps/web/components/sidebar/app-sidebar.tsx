"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarMenuSkeleton,
} from "@workspace/ui/components/sidebar"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useConversations } from "@/hooks/use-conversations"

export function AppSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentId = searchParams.get("id")
  const { conversations, isLoading, delete: deleteConversation } =
    useConversations()

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this conversation?")
    if (!confirmed) return
    await deleteConversation({ id })
    if (currentId === id) {
      router.push("/chat")
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="font-heading text-lg font-semibold">Kira</span>
        </div>
        <div className="px-2 pb-2">
          <Link href="/chat" className={cn(buttonVariants({ size: "sm" }), "w-full justify-start gap-2")}>
            + New chat
          </Link>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <div className="px-2 py-1">
        <Link
          href="/catalogue"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          Catalogue
        </Link>
      </div>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))}
              {conversations.map((conv: { id: string; title: string }) => (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton render={<Link href={`/chat?id=${conv.id}`} />}>
                    <span className="truncate">{conv.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(conv.id)
                    }}
                    aria-label="Delete conversation"
                  >
                    <DeleteIcon />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function DeleteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}
