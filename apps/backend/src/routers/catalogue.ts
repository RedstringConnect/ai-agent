import { z } from "zod"
import { publicProcedure, router } from "../trpc"
import { BUILT_IN_SKILLS, type SkillEntry } from "../skills-data"

function extractCapabilities(content: string): string[] {
  const caps: string[] = []
  const capMatch = content.match(/## Capabilities\n\n([\s\S]*?)(?:\n##|$)/)
  if (capMatch?.[1]) {
    for (const line of capMatch[1].split("\n")) {
      const m = line.match(/^- \*\*([^*]+)\*\*/)
      if (m?.[1]) caps.push(m[1].trim())
    }
  }
  return caps
}

function extractTools(content: string): string[] {
  const tools: string[] = []
  const toolSection = content.match(/## Available Tools\n\n([\s\S]*?)(?:\n##|$)/)
  if (toolSection?.[1]) {
    for (const line of toolSection[1].split("\n")) {
      const m = line.match(/^### (\w+)/)
      if (m?.[1]) tools.push(m[1])
    }
  }
  return tools
}

export type CatalogueEntry = {
  name: string
  description: string
  type: "skill" | "agent"
  capabilities: string[]
  tools: string[]
}

function toCatalogue(skill: SkillEntry): CatalogueEntry {
  const type = skill.name === "orchestrator-rules" ? "skill" : "agent"
  return {
    name: skill.name,
    description: skill.description,
    type,
    capabilities: extractCapabilities(skill.content),
    tools: extractTools(skill.content),
  }
}

export const catalogueRouter = router({
  list: publicProcedure.query(async () => {
    return BUILT_IN_SKILLS.map(toCatalogue)
  }),

  get: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const skill = BUILT_IN_SKILLS.find(
        (s) => s.name.toLowerCase() === input.name.toLowerCase(),
      )
      if (!skill) {
        throw new Error(`Skill '${input.name}' not found`)
      }
      return {
        ...toCatalogue(skill),
        content: skill.content,
      }
    }),
})
