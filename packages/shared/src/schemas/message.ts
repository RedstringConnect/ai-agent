import { z } from "zod"

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  userId: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  createdAt: z.date(),
})

export const createMessageSchema = z.object({
  conversationId: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string().min(1),
})

export type Message = z.infer<typeof messageSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
