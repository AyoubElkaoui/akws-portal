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
import { Pencil } from "lucide-react"

interface EditContactDialogProps {
  contact: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    company: string | null
    notes: string | null
  }
}

export function EditContactDialog({ contact }: EditContactDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          company: formData.get("company"),
          notes: formData.get("notes"),
        }),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }

      toast.success("Contact bijgewerkt")
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
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Bewerken
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact bewerken</DialogTitle>
          <DialogDescription>
            Pas de gegevens van dit contact aan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">Voornaam</Label>
              <Input
                id="edit-firstName"
                name="firstName"
                defaultValue={contact.firstName}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Achternaam</Label>
              <Input
                id="edit-lastName"
                name="lastName"
                defaultValue={contact.lastName}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mailadres</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              defaultValue={contact.email || ""}
              placeholder="jan@voorbeeld.nl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefoonnummer</Label>
            <Input
              id="edit-phone"
              name="phone"
              defaultValue={contact.phone || ""}
              placeholder="06-12345678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company">Bedrijf</Label>
            <Input
              id="edit-company"
              name="company"
              defaultValue={contact.company || ""}
              placeholder="Bedrijfsnaam"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notitie</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              defaultValue={contact.notes || ""}
              placeholder="Optionele notitie..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Opslaan..." : "Wijzigingen opslaan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
