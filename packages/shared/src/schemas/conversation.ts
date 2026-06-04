import { z } from "zod"

export const conversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional().default("New conversation"),
})

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200),
})

export type Conversation = z.infer<typeof conversationSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>
