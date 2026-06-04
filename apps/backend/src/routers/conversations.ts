import { z } from "zod"
import { eq, desc } from "drizzle-orm"
import { getDb } from "../db"
import { conversations, messages } from "../db/schema"
import { publicProcedure, router } from "../trpc"

export const conversationsRouter = router({
  list: publicProcedure.query(async () => {
    return getDb()
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string(), includeMessages: z.boolean().optional().default(true) }))
    .query(async ({ input }) => {
      const [conversation] = await getDb()
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.id))
        .limit(1)

      if (!conversation) return null

      if (!input.includeMessages) return conversation

      const conversationMessages = await getDb()
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.id))
        .orderBy(messages.createdAt)

      return { ...conversation, messages: conversationMessages }
    }),

  create: publicProcedure
    .input(z.object({ id: z.string().optional(), title: z.string().optional() }))
    .mutation(async ({ input }) => {
      const id = input.id ?? crypto.randomUUID()
      const now = new Date()

      await getDb().insert(conversations).values({
        id,
        title: input.title ?? "New conversation",
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()

      const [conversation] = await getDb()
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1)

      return conversation
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), title: z.string() }))
    .mutation(async ({ input }) => {
      await getDb()
        .update(conversations)
        .set({ title: input.title, updatedAt: new Date() })
        .where(eq(conversations.id, input.id))

      const [conversation] = await getDb()
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.id))
        .limit(1)

      return conversation
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await getDb()
        .delete(conversations)
        .where(eq(conversations.id, input.id))
      return { success: true }
    }),

  saveMessages: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        messages: z.array(
          z.object({
            id: z.string(),
            role: z.enum(["user", "assistant"]),
            content: z.string(),
            createdAt: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const [conversation] = await getDb()
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1)

      if (!conversation) {
        const now = new Date()
        await getDb().insert(conversations).values({
          id: input.conversationId,
          title: "New conversation",
          createdAt: now,
          updatedAt: now,
        }).onConflictDoNothing()
      }

      const deleteQuery = getDb()
        .delete(messages)
        .where(eq(messages.conversationId, input.conversationId))

      const batchItems: any[] = [deleteQuery]

      if (input.messages.length > 0) {
        batchItems.push(
          getDb().insert(messages).values(
            input.messages.map((m) => ({
              id: m.id,
              conversationId: input.conversationId,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            })),
          ),
        )
      }

      batchItems.push(
        getDb()
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, input.conversationId)),
      )

      await getDb().batch(batchItems as any)

      return { success: true }
    }),
})
