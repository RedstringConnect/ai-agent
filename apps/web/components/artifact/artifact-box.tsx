"use client"

import { Button } from "@workspace/ui/components/button"
import { useArtifact, type Artifact } from "@/providers/artifact-provider"

function getIcon(type: Artifact["type"]): string {
  switch (type) {
    case "candidates":
      return "👥"
    case "document":
      return "📄"
    case "code":
      return "💻"
  }
}

function getCtaLabel(type: Artifact["type"]): string {
  switch (type) {
    case "candidates":
      return "View Profiles"
    case "document":
      return "Open Document"
    case "code":
      return "View Code"
  }
}

export function ArtifactBox({ artifact }: { artifact: Artifact }) {
  const { expand } = useArtifact()

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 my-2">
      <span className="text-xl">{getIcon(artifact.type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{artifact.title}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => expand(artifact)}
      >
        {getCtaLabel(artifact.type)}
      </Button>
    </div>
  )
}
