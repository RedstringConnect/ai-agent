import { describe, it, expect } from "vitest"

describe("skills", () => {
  describe("parseFrontmatter", () => {
    it("parses name and description from frontmatter", async () => {
      const { parseFrontmatter } = await import("../skills")
      const content = `---
name: test-skill
description: A test skill description
---
Some content here`

      const result = parseFrontmatter(content)
      expect(result.name).toBe("test-skill")
      expect(result.description).toBe("A test skill description")
    })

    it("throws on missing frontmatter", async () => {
      const { parseFrontmatter } = await import("../skills")
      expect(() => parseFrontmatter("no frontmatter")).toThrow("No frontmatter found")
    })

    it("throws on missing name", async () => {
      const { parseFrontmatter } = await import("../skills")
      const content = `---
description: A test
---
content`
      expect(() => parseFrontmatter(content)).toThrow("Skill missing 'name'")
    })

    it("throws on missing description", async () => {
      const { parseFrontmatter } = await import("../skills")
      const content = `---
name: test-skill
---
content`
      expect(() => parseFrontmatter(content)).toThrow("Skill missing 'description'")
    })
  })

  describe("stripFrontmatter", () => {
    it("strips frontmatter and returns body", async () => {
      const { stripFrontmatter } = await import("../skills")
      const content = `---
name: test
description: test
---
Body content here`

      const result = stripFrontmatter(content)
      expect(result).toBe("Body content here")
    })

    it("handles content without frontmatter", async () => {
      const { stripFrontmatter } = await import("../skills")
      expect(stripFrontmatter("just content")).toBe("just content")
    })
  })

  describe("buildSkillsPrompt", () => {
    it("returns empty string for no skills", async () => {
      const { buildSkillsPrompt } = await import("../skills")
      expect(buildSkillsPrompt([])).toBe("")
    })

    it("builds prompt with skills list", async () => {
      const { buildSkillsPrompt } = await import("../skills")
      const skills = [
        { name: "skill-a", description: "First skill", path: "/skills/a" },
        { name: "skill-b", description: "Second skill", path: "/skills/b" },
      ]

      const prompt = buildSkillsPrompt(skills)
      expect(prompt).toContain("skill-a: First skill")
      expect(prompt).toContain("skill-b: Second skill")
    })
  })

  describe("loadSkillContent", () => {
    it("returns error for unknown skill", async () => {
      const { loadSkillContent } = await import("../skills")
      const result = await loadSkillContent("unknown", [])
      expect("error" in result).toBe(true)
      if ("error" in result) {
        expect(result.error).toContain("unknown")
      }
    })

    it("returns error for skill not found case-insensitively", async () => {
      const { loadSkillContent } = await import("../skills")
      const skills = [{ name: "MySkill", description: "desc", path: "/dev/null" }]
      const result = await loadSkillContent("unknown", skills)
      expect("error" in result).toBe(true)
    })
  })
})
