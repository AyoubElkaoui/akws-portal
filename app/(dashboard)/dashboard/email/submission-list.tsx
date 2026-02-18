"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Inbox, Eye } from "lucide-react"

interface Submission {
  id: string
  formName: string
  data: Record<string, unknown>
  read: boolean
  createdAt: string
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? "Ja" : "Nee"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

function getPreview(data: Record<string, unknown>): string {
  const entries = Object.entries(data)
  if (entries.length === 0) return "Geen data"
  const preview = entries
    .slice(0, 3)
    .map(([key, value]) => `${formatKey(key)}: ${formatValue(value)}`)
    .join(" | ")
  return entries.length > 3 ? `${preview} ...` : preview
}

export function SubmissionList({ submissions }: { submissions: Submission[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Submission | null>(null)

  async function handleOpen(submission: Submission) {
    setSelected(submission)

    if (!submission.read) {
      await fetch("/api/email/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submission.id }),
      })
      router.refresh()
    }
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Inbox className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 text-center">
            Er zijn nog geen formulier-inzendingen ontvangen.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {submissions.map((sub) => (
          <Card
            key={sub.id}
            className={`cursor-pointer transition-colors hover:bg-slate-50 ${!sub.read ? "border-blue-200 bg-blue-50/30" : ""}`}
            onClick={() => handleOpen(sub)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900">
                    {sub.formName}
                  </span>
                  {!sub.read && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      Nieuw
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {getPreview(sub.data as Record<string, unknown>)}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <span className="text-xs text-slate-400">
                  {formatDate(sub.createdAt)}
                </span>
                <Eye className="h-4 w-4 text-slate-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.formName}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Ontvangen op {formatDate(selected.createdAt)}
              </p>
              <div className="space-y-2">
                {Object.entries(selected.data as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 shrink-0">{formatKey(key)}</span>
                    <span className="text-slate-900 text-right">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
