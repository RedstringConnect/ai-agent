import { contextStore } from "../context-store"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8788"

export interface SourcingFilters {
  role?: string
  skills?: string[]
  location?: string
  experienceMin?: number
  experienceMax?: number
}

export function calculateMatchScore(
  candidate: { role: string; skills: string | null; location: string | null; experience: number },
  filters: SourcingFilters,
): number {
  let score = 0
  let total = 0

  if (filters.role) {
    total++
    if (candidate.role.toLowerCase().includes(filters.role.toLowerCase())) {
      score++
    }
  }

  if (filters.skills && filters.skills.length > 0) {
    total++
    const candidateSkills = (candidate.skills ?? "").toLowerCase()
    const matched = filters.skills.filter((s) => candidateSkills.includes(s.toLowerCase())).length
    score += matched / filters.skills.length
  }

  if (filters.location) {
    total++
    if (candidate.location?.toLowerCase().includes(filters.location.toLowerCase())) {
      score++
    }
  }

  if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
    total++
    const min = filters.experienceMin ?? 0
    const max = filters.experienceMax ?? 99
    if (candidate.experience >= min && candidate.experience <= max) {
      score++
    }
  }

  if (total === 0) return 50
  return Math.round((score / total) * 100)
}

export async function sourcingAgent(filters: SourcingFilters, chatId?: string): Promise<string> {
  const { role, skills, location, experienceMin, experienceMax } = filters
  try {
    const input = JSON.stringify({ role, skills, location, experienceMin, experienceMax, limit: 10 })
    const url = `${BACKEND_URL}/trpc/candidates.list?input=${encodeURIComponent(input)}`
    const res = await fetch(url)

    if (!res.ok) {
      const errorText = await res.text().catch(() => "")
      const errorMsg = `Candidate database error (${res.status}): ${errorText || res.statusText}`
      if (chatId) contextStore.appendToolResult(chatId, "delegateSourcing", errorMsg)
      return errorMsg
    }

    const json = (await res.json()) as any
    const data = json?.result?.data

    if (!data || !data.candidates || data.candidates.length === 0) {
      const filterStrings = [
        role && `role: ${role}`,
        location && `location: ${location}`,
        skills?.length ? `skills: ${skills.join(", ")}` : "",
        experienceMin !== undefined ? `min exp: ${experienceMin}` : "",
        experienceMax !== undefined ? `max exp: ${experienceMax}` : ""
      ].filter(Boolean).join(", ")
      const msg = `No candidates found matching your criteria (${filterStrings}). Try broadening the search.`
      if (chatId) contextStore.appendToolResult(chatId, "delegateSourcing", msg)
      return msg
    }

    const { candidates: rows, total } = data

    const formatted = rows.map((c: any) => ({
      name: c.name,
      role: c.role,
      location: c.location ?? "N/A",
      skills: c.skills ? c.skills.split(",").map((s: string) => s.trim()) : [],
      experience: `${c.experience} years`,
      matchScore: calculateMatchScore(c, filters),
      highlights: c.skills
        ? `Skilled in ${c.skills.split(",").slice(0, 3).join(", ")}${c.skills.split(",").length > 3 ? " and more" : ""}`
        : "",
    }))

    formatted.sort((a: any, b: any) => b.matchScore - a.matchScore)

    const parts: string[] = []
    if (role) parts.push(`role "${role}"`)
    if (skills?.length) parts.push(`skills [${skills.join(", ")}]`)
    if (location) parts.push(`location "${location}"`)
    if (experienceMin !== undefined || experienceMax !== undefined) {
      parts.push(`experience ${experienceMin ?? 0}-${experienceMax ?? "any"} years`)
    }
    const criteriaStr = parts.length > 0 ? ` for ${parts.join(", ")}` : ""

    const result = JSON.stringify({
      summary: `Found ${total} candidate${total !== 1 ? "s" : ""}${criteriaStr}. Showing top ${formatted.length} result${formatted.length !== 1 ? "s" : ""} ranked by match score.`,
      candidates: formatted,
    })

    if (chatId) contextStore.appendToolResult(chatId, "delegateSourcing", result)
    return result
  } catch (err: any) {
    const errorMsg = `Error searching candidates: Unable to reach the candidate database. ${err?.message ?? ""}`
    if (chatId) contextStore.appendToolResult(chatId, "delegateSourcing", errorMsg)
    return errorMsg
  }
}
