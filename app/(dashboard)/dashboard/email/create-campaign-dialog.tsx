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
import { Plus } from "lucide-react"

export function CreateCampaignDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formData.get("subject"),
          body: formData.get("body"),
        }),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }

      toast.success("Campagne aangemaakt")
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe campagne
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nieuwe e-mailcampagne</DialogTitle>
          <DialogDescription>
            Maak een nieuwsbrief of e-mailcampagne aan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Onderwerp</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="bijv. Nieuwsbrief januari"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Inhoud</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Schrijf je e-mail hier... (HTML wordt ondersteund)"
              rows={10}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Bezig..." : "Campagne aanmaken"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
