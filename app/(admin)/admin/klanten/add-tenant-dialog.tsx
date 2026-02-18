"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export function AddTenantDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      companyName: formData.get("companyName") as string,
      slug: formData.get("slug") as string,
      plan: formData.get("plan") as string,
      domain: formData.get("domain") as string || undefined,
      userName: formData.get("userName") as string,
      userEmail: formData.get("userEmail") as string,
      userPassword: formData.get("userPassword") as string,
    }

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }

      toast.success("Klant succesvol aangemaakt")
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
          Nieuwe klant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuwe klant toevoegen</DialogTitle>
          <DialogDescription>
            Maak een nieuw klantaccount aan met een bedrijfsprofiel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Bedrijfsnaam</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Kapper Jan"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="kapper-jan"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p className="text-xs text-slate-500">
              Alleen kleine letters, cijfers en streepjes
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Pakket</Label>
            <Select name="plan" defaultValue="STARTER">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STARTER">Starter — €29/mnd</SelectItem>
                <SelectItem value="BUSINESS">Business — €59/mnd</SelectItem>
                <SelectItem value="PREMIUM">Premium — €99/mnd</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Website (optioneel)</Label>
            <Input
              id="domain"
              name="domain"
              placeholder="https://kapperjan.nl"
            />
          </div>
          <hr />
          <p className="text-sm font-medium text-slate-700">
            Gebruikersaccount
          </p>
          <div className="space-y-2">
            <Label htmlFor="userName">Naam</Label>
            <Input id="userName" name="userName" placeholder="Jan de Vries" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userEmail">E-mailadres</Label>
            <Input
              id="userEmail"
              name="userEmail"
              type="email"
              placeholder="jan@kapperjan.nl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userPassword">Wachtwoord</Label>
            <Input
              id="userPassword"
              name="userPassword"
              type="password"
              placeholder="Minimaal 8 tekens"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Bezig..." : "Klant aanmaken"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
