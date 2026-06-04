"use client"

import { trpc } from "@/lib/trpc/client"

export function useConversations() {
  const utils = trpc.useUtils()

  const list = trpc.conversations.list.useQuery()

  const createMutation = trpc.conversations.create.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate()
    },
  })

  const updateMutation = trpc.conversations.update.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate()
    },
  })

  const deleteMutation = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate()
    },
  })

  return {
    conversations: list.data ?? [],
    isLoading: list.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
