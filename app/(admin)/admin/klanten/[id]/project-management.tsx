"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, Circle, Plus, Trash2 } from "lucide-react"

interface Milestone {
  id: string
  title: string
  completed: boolean
  dueDate: string | null
}

interface Revision {
  id: string
  description: string
  status: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  status: string
  milestones: Milestone[]
  revisions: Revision[]
}

const statusLabels: Record<string, string> = {
  OFFERTE: "Offerte",
  ACTIEF: "Actief",
  AFGEROND: "Afgerond",
  GEPAUZEERD: "Gepauzeerd",
}

const statusColors: Record<string, string> = {
  OFFERTE: "bg-slate-100 text-slate-700",
  ACTIEF: "bg-green-100 text-green-700",
  AFGEROND: "bg-blue-100 text-blue-700",
  GEPAUZEERD: "bg-orange-100 text-orange-700",
}

const revisionStatusLabels: Record<string, string> = {
  AANGEVRAAGD: "Aangevraagd",
  IN_BEHANDELING: "In behandeling",
  AFGEROND: "Afgerond",
}

export function ProjectManagement({ project }: { project: Project }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newMilestone, setNewMilestone] = useState("")

  async function handleStatusChange(status: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }
      toast.success("Status bijgewerkt")
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleMilestone(milestoneId: string, completed: boolean) {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId, completed: !completed }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    }
  }

  async function handleAddMilestone() {
    if (!newMilestone.trim()) return
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newMilestone }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }
      setNewMilestone("")
      toast.success("Milestone toegevoegd")
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    }
  }

  async function handleRevisionStatus(revisionId: string, status: string) {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/revisions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId, status }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }
      toast.success("Revisie status bijgewerkt")
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    }
  }

  async function handleDelete() {
    if (!confirm("Weet je zeker dat je dit project wilt verwijderen?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }
      toast.success("Project verwijderd")
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setLoading(false)
    }
  }

  const completedMilestones = project.milestones.filter((m) => m.completed).length

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{project.name}</span>
          <Badge variant="secondary" className={statusColors[project.status]}>
            {statusLabels[project.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={project.status} onValueChange={handleStatusChange} disabled={loading}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OFFERTE">Offerte</SelectItem>
              <SelectItem value="ACTIEF">Actief</SelectItem>
              <SelectItem value="AFGEROND">Afgerond</SelectItem>
              <SelectItem value="GEPAUZEERD">Gepauzeerd</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500">
          Milestones ({completedMilestones}/{project.milestones.length})
        </p>
        {project.milestones.map((ms) => (
          <button
            key={ms.id}
            onClick={() => handleToggleMilestone(ms.id, ms.completed)}
            className="flex items-center gap-2 w-full text-left text-sm py-0.5 hover:bg-slate-50 rounded px-1"
          >
            {ms.completed ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            )}
            <span className={ms.completed ? "text-slate-400 line-through" : "text-slate-700"}>
              {ms.title}
            </span>
          </button>
        ))}
        <div className="flex gap-1 mt-1">
          <Input
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            placeholder="Nieuwe milestone..."
            className="h-7 text-xs"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMilestone())}
          />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleAddMilestone}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Revisions */}
      {project.revisions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">Revisies</p>
          {project.revisions.map((rev) => (
            <div key={rev.id} className="flex items-center justify-between text-xs py-0.5">
              <span className="text-slate-700 truncate flex-1">{rev.description}</span>
              <Select
                value={rev.status}
                onValueChange={(v) => handleRevisionStatus(rev.id, v)}
              >
                <SelectTrigger className="w-32 h-6 text-xs ml-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AANGEVRAAGD">Aangevraagd</SelectItem>
                  <SelectItem value="IN_BEHANDELING">In behandeling</SelectItem>
                  <SelectItem value="AFGEROND">Afgerond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
