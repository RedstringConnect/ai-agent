import { z } from "zod"
import { eq, desc, and, like, gte, lte, or, sql } from "drizzle-orm"
import { getDb } from "../db"
import { candidates } from "../db/schema"
import { publicProcedure, router } from "../trpc"

const candidateStatusEnum = z.enum(["active", "hired", "rejected", "interviewing"])

export const candidatesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        department: z.string().optional(),
        role: z.string().optional(),
        status: candidateStatusEnum.optional(),
        skills: z.array(z.string()).optional(),
        experienceMin: z.number().optional(),
        experienceMax: z.number().optional(),
        location: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const filters: any[] = []

      if (input.department) {
        filters.push(eq(candidates.department, input.department))
      }
      if (input.role) {
        const keywords = input.role.split(/\s+/).filter(Boolean)
        if (keywords.length > 1) {
          const roleFilters = keywords.map((k) => like(candidates.role, `%${k}%`))
          const skillFilters = keywords.map((k) => like(candidates.skills, `%${k}%`))
          filters.push(or(...roleFilters, ...skillFilters))
        } else {
          filters.push(or(like(candidates.role, `%${input.role}%`), like(candidates.skills, `%${input.role}%`)))
        }
      }
      if (input.status) {
        filters.push(eq(candidates.status, input.status))
      }
      if (input.skills && input.skills.length > 0) {
        const skillFilters = input.skills.map((s) => like(candidates.skills, `%${s}%`))
        filters.push(or(...skillFilters))
      }
      if (input.experienceMin !== undefined) {
        filters.push(gte(candidates.experience, input.experienceMin))
      }
      if (input.experienceMax !== undefined) {
        filters.push(lte(candidates.experience, input.experienceMax))
      }
      if (input.location) {
        filters.push(like(candidates.location, `%${input.location}%`))
      }

      const where = filters.length > 0 ? and(...filters) : undefined

      const rows = await getDb()
        .select()
        .from(candidates)
        .where(where)
        .orderBy(desc(candidates.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      const [countResult] = await getDb()
        .select({ count: sql<number>`count(*)` })
        .from(candidates)
        .where(where)

      return {
        candidates: rows,
        total: Number(countResult?.count ?? 0),
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [candidate] = await getDb()
        .select()
        .from(candidates)
        .where(eq(candidates.id, input.id))
        .limit(1)

      return candidate ?? null
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        role: z.string().min(1),
        department: z.string().min(1),
        experience: z.number().min(0),
        salary: z.number().optional(),
        location: z.string().optional(),
        skills: z.string().optional(),
        status: candidateStatusEnum.optional().default("active"),
      }),
    )
    .mutation(async ({ input }) => {
      const id = crypto.randomUUID()
      await getDb().insert(candidates).values({ id, ...input })
      const [candidate] = await getDb()
        .select()
        .from(candidates)
        .where(eq(candidates.id, id))
        .limit(1)
      return candidate
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.string().min(1).optional(),
        department: z.string().min(1).optional(),
        experience: z.number().min(0).optional(),
        salary: z.number().optional(),
        location: z.string().optional(),
        skills: z.string().optional(),
        status: candidateStatusEnum.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input
      const filtered = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined),
      )
      if (Object.keys(filtered).length === 0) {
        const [candidate] = await getDb()
          .select()
          .from(candidates)
          .where(eq(candidates.id, id))
          .limit(1)
        return candidate
      }
      await getDb().update(candidates).set(filtered).where(eq(candidates.id, id))
      const [candidate] = await getDb()
        .select()
        .from(candidates)
        .where(eq(candidates.id, id))
        .limit(1)
      return candidate
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await getDb().delete(candidates).where(eq(candidates.id, input.id))
      return { success: true }
    }),
})
