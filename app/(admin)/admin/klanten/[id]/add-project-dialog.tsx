"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

interface AddProjectDialogProps {
  tenantId: string
}

export function AddProjectDialog({ tenantId }: AddProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          name: formData.get("name"),
          description: formData.get("description"),
          status: formData.get("status"),
          startDate: formData.get("startDate") || undefined,
          endDate: formData.get("endDate") || undefined,
        }),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }

      toast.success("Project aangemaakt")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Nieuw project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuw project aanmaken</DialogTitle>
          <DialogDescription>
            Maak een project aan voor deze klant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Projectnaam</Label>
            <Input id="name" name="name" placeholder="bijv. Website redesign" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea id="description" name="description" placeholder="Korte beschrijving..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select name="status" defaultValue="OFFERTE">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OFFERTE">Offerte</SelectItem>
                <SelectItem value="ACTIEF">Actief</SelectItem>
                <SelectItem value="AFGEROND">Afgerond</SelectItem>
                <SelectItem value="GEPAUZEERD">Gepauzeerd</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Startdatum</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Einddatum</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aanmaken..." : "Project aanmaken"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
