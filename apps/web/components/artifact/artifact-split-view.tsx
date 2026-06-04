"use client"

import { useState, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { useArtifact } from "@/providers/artifact-provider"
import { CandidatesTable } from "@/components/candidates-table"

function DownloadButton({ content, filename }: { content: string; filename: string }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      Download
    </Button>
  )
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </Button>
  )
}

function DocumentView({ content }: { content: string }) {
  const paragraphs = content.split("\n").filter(Boolean)
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed">{p}</p>
      ))}
    </div>
  )
}

function CodeView({ content }: { content: string }) {
  return (
    <div className="relative">
      <div className="absolute right-2 top-2">
        <CopyButton content={content} />
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 pt-10 text-sm">
        <code>{content}</code>
      </pre>
    </div>
  )
}

export function ArtifactSplitView() {
  const { artifact, isOpen, collapse } = useArtifact()

  if (!isOpen || !artifact) return null

  return (
    <div className="flex h-full flex-col border-l">
      <header className="flex h-12 items-center justify-between gap-2 border-b px-4">
        <span className="text-sm font-medium truncate">{artifact.title}</span>
        <div className="flex items-center gap-2">
          {artifact.type === "document" && typeof artifact.data === "string" && (
            <DownloadButton content={artifact.data} filename={`${artifact.title}.txt`} />
          )}
          <Button variant="ghost" size="sm" onClick={collapse}>
            Close
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {artifact.type === "candidates" && Array.isArray(artifact.data) && (
          <CandidatesTable candidates={artifact.data as any[]} />
        )}
        {artifact.type === "document" && typeof artifact.data === "string" && (
          <DocumentView content={artifact.data} />
        )}
        {artifact.type === "code" && typeof artifact.data === "string" && (
          <CodeView content={artifact.data} />
        )}
      </div>
    </div>
  )
}
