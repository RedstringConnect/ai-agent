import { BUILT_IN_SKILLS, type SkillEntry } from "./skills-data"

export interface SkillMetadata {
  name: string
  description: string
  path: string
}

export function parseFrontmatter(content: string): { name: string; description: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match?.[1]) throw new Error("No frontmatter found")

  const yaml = match[1]
  const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim()
  const description = yaml.match(/^description:\s*(.+)$/m)?.[1]?.trim()

  if (!name) throw new Error("Skill missing 'name' in frontmatter")
  if (!description) throw new Error("Skill missing 'description' in frontmatter")

  return { name, description }
}

export function stripFrontmatter(content: string): string {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim()
}

export function discoverSkills(): SkillMetadata[] {
  return BUILT_IN_SKILLS.map((s) => ({
    name: s.name,
    description: s.description,
    path: s.name,
  }))
}

export function buildSkillsPrompt(skills: SkillMetadata[]): string {
  if (skills.length === 0) return ""

  const skillsList = skills.map((s) => `- ${s.name}: ${s.description}`).join("\n")

  return `
## Available Skills

You have access to specialized skills that extend your capabilities. Use the \`loadSkill\` tool when the user's request would benefit from specialized instructions.

${skillsList}`
}

export interface LoadSkillResult {
  skillDirectory: string
  content: string
}

export async function loadSkillContent(name: string, _skills: SkillMetadata[]): Promise<LoadSkillResult | { error: string }> {
  const skill = BUILT_IN_SKILLS.find((s) => s.name.toLowerCase() === name.toLowerCase())
  if (!skill) {
    return { error: `Skill '${name}' not found` }
  }

  const body = stripFrontmatter(skill.content)

  return { skillDirectory: skill.name, content: body }
}

export function getSkillDirectories(): string[] {
  return []
}
