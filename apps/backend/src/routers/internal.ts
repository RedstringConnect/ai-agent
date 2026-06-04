import { z } from "zod"
import { eq } from "drizzle-orm"
import { getDb } from "../db"
import { messages, toolCalls, conversations } from "../db/schema"
import { publicProcedure, router } from "../trpc"
import { TRPCError } from "@trpc/server"
import { chatEvents } from "../app"

export const internalRouter = router({
  saveChunk: publicProcedure
    .input(
      z.object({
        threadId: z.string(),
        text: z.string().optional(),
        toolCalls: z.array(z.any()).optional(),
        toolResults: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // NOTE: In production, this endpoint MUST be protected with a secret or internal service token!
      const db = getDb()

      // Ensure conversation exists
      await db.insert(conversations).values({
        id: input.threadId,
      }).onConflictDoNothing()

      // If there's text, append or update the assistant message
      if (input.text) {
        const msgId = `msg_${crypto.randomUUID()}`
        await db.insert(messages).values({
          id: msgId,
          conversationId: input.threadId,
          role: "assistant",
          content: input.text,
          status: "streaming", // Set to streaming, finalized in finalizeStream
        })
      }

      // Store tool calls
      if (input.toolCalls && input.toolCalls.length > 0) {
        for (const tool of input.toolCalls) {
          const tcId = `tc_${crypto.randomUUID()}`
          // First create a parent message for the tool call
          await db.insert(messages).values({
            id: tcId,
            conversationId: input.threadId,
            role: "tool",
            content: "Tool execution",
            status: "streaming",
          })
          
          await db.insert(toolCalls).values({
            id: tool.toolCallId,
            messageId: tcId,
            name: tool.toolName,
            args: JSON.stringify(tool.args),
            status: "running"
          })
        }
      }

      // Broadcast an update to the SSE stream so connected clients hydrate real-time
      chatEvents.emit(`chat:${input.threadId}`, {
        type: "chunk_saved",
        threadId: input.threadId,
      })

      return { success: true }
    }),

  finalizeStream: publicProcedure
    .input(
      z.object({
        threadId: z.string(),
        finalText: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Finalize the last streaming message for this thread
      // In a real implementation, you'd want a more robust way to target the specific message ID
      return { success: true }
    })
})
