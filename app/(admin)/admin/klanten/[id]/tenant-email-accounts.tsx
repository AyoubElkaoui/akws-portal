"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Mail, Plus, Trash2, Loader2 } from "lucide-react"

interface EmailAccount {
  id: string
  email: string
  displayName: string | null
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  username: string
  useTls: boolean
  active: boolean
  createdAt: string
}

interface TenantEmailAccountsProps {
  tenantId: string
}

export function TenantEmailAccounts({ tenantId }: TenantEmailAccountsProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [tenantId])

  async function fetchAccounts() {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/email-accounts`)
      const result = await res.json()
      if (result.success) {
        setAccounts(result.data)
      }
    } catch {
      toast.error("Fout bij ophalen e-mailaccounts")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(accountId: string) {
    if (!confirm("Weet je zeker dat je dit e-mailaccount wilt verwijderen?")) return

    setDeleting(accountId)
    try {
      const res = await fetch(
        `/api/admin/tenants/${tenantId}/email-accounts/${accountId}`,
        { method: "DELETE" },
      )
      const result = await res.json()
      if (result.success) {
        toast.success("E-mailaccount verwijderd")
        setAccounts((prev) => prev.filter((a) => a.id !== accountId))
      } else {
        toast.error(result.error || "Fout bij verwijderen")
      }
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4" />
          E-mailaccounts
        </CardTitle>
        <AddAccountDialog tenantId={tenantId} onAdded={fetchAccounts} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            Geen e-mailaccounts gekoppeld aan deze klant.
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {account.email}
                    </p>
                    {account.displayName && (
                      <span className="text-xs text-slate-400">
                        ({account.displayName})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    IMAP: {account.imapHost}:{account.imapPort} | SMTP:{" "}
                    {account.smtpHost}:{account.smtpPort}
                    {account.useTls ? " | TLS" : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(account.id)}
                  disabled={deleting === account.id}
                >
                  {deleting === account.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddAccountDialog({
  tenantId,
  onAdded,
}: {
  tenantId: string
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    imapHost: "",
    imapPort: 993,
    smtpHost: "",
    smtpPort: 465,
    username: "",
    password: "",
    useTls: true,
  })

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setForm({
      email: "",
      displayName: "",
      imapHost: "",
      imapPort: 993,
      smtpHost: "",
      smtpPort: 465,
      username: "",
      password: "",
      useTls: true,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/email-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          username: form.username || form.email,
        }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Fout bij toevoegen")
        return
      }
      toast.success("E-mailaccount toegevoegd!")
      setOpen(false)
      resetForm()
      onAdded()
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          Account toevoegen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>E-mailaccount toevoegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">E-mailadres</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="info@bedrijf.nl"
                required
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Weergavenaam (optioneel)</Label>
              <Input
                value={form.displayName}
                onChange={(e) => update("displayName", e.target.value)}
                placeholder="Bedrijfsnaam"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IMAP server</Label>
              <Input
                value={form.imapHost}
                onChange={(e) => update("imapHost", e.target.value)}
                placeholder="mail.voorbeeld.nl"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IMAP poort</Label>
              <Input
                type="number"
                value={form.imapPort}
                onChange={(e) =>
                  update("imapPort", parseInt(e.target.value) || 993)
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SMTP server</Label>
              <Input
                value={form.smtpHost}
                onChange={(e) => update("smtpHost", e.target.value)}
                placeholder="mail.voorbeeld.nl"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SMTP poort</Label>
              <Input
                type="number"
                value={form.smtpPort}
                onChange={(e) =>
                  update("smtpPort", parseInt(e.target.value) || 465)
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gebruikersnaam</Label>
              <Input
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                placeholder="info@bedrijf.nl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Wachtwoord</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                id="useTls"
                checked={form.useTls}
                onCheckedChange={(checked) => update("useTls", checked)}
              />
              <Label htmlFor="useTls" className="text-xs">
                Gebruik TLS/SSL
              </Label>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Verbinding testen...
              </>
            ) : (
              "Account toevoegen"
            )}
          </Button>
          <p className="text-xs text-slate-400 text-center">
            De IMAP en SMTP verbinding wordt getest voordat het account wordt
            opgeslagen.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
