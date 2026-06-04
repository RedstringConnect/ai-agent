"use client"

interface Candidate {
  name: string
  role: string
  location: string
  skills: string[]
  experience: string
  matchScore?: number
}

function getMatchColor(score?: number): string {
  if (!score) return "bg-muted text-muted-foreground"
  if (score >= 85) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  if (score >= 70) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
  return "bg-muted text-muted-foreground"
}

export function CandidatesTable({ candidates }: { candidates: Candidate[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Role</th>
            <th className="pb-2 pr-4 font-medium">Location</th>
            <th className="pb-2 pr-4 font-medium">Skills</th>
            <th className="pb-2 pr-4 font-medium">Experience</th>
            <th className="pb-2 font-medium">Match</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{c.name}</td>
              <td className="py-2 pr-4 text-muted-foreground">{c.role}</td>
              <td className="py-2 pr-4 text-muted-foreground">{c.location}</td>
              <td className="py-2 pr-4">
                <div className="flex flex-wrap gap-1">
                  {(c.skills ?? []).map((s, j) => (
                    <span
                      key={j}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-2 pr-4 text-muted-foreground">{c.experience}</td>
              <td className="py-2">
                {c.matchScore !== undefined && (
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${getMatchColor(c.matchScore)}`}
                  >
                    {c.matchScore}%
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
