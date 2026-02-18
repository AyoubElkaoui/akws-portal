"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { InvoicePreview } from "@/components/shared/invoice-preview"

interface Tenant {
  id: string
  companyName: string
  domain: string | null
  logo: string | null
  plan: string
  email: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

const VAT_PERCENTAGES: Record<string, number> = {
  STANDAARD: 0.21,
  LAAG: 0.09,
  VRIJGESTELD: 0,
}

const VAT_LABELS: Record<string, string> = {
  STANDAARD: "21% (standaard)",
  LAAG: "9% (laag)",
  VRIJGESTELD: "0% (vrijgesteld)",
}

const SERVICE_SUGGESTIONS = [
  { description: "Website hosting (maandelijks)", unitPrice: 25 },
  { description: "Website onderhoud (maandelijks)", unitPrice: 50 },
  { description: "Support pakket", unitPrice: 75 },
  { description: "SSL-certificaat (jaarlijks)", unitPrice: 15 },
  { description: "Domeinregistratie (jaarlijks)", unitPrice: 12 },
]

export function PlatformInvoiceForm({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [vatRate, setVatRate] = useState("STANDAARD")
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ])

  const selectedTenant = tenants.find((t) => t.id === tenantId)
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const vatAmount = subtotal * (VAT_PERCENTAGES[vatRate] ?? 0.21)
  const total = subtotal + vatAmount

  function handleTenantChange(id: string) {
    setTenantId(id)
    const tenant = tenants.find((t) => t.id === id)
    if (tenant) {
      setCustomerName(tenant.companyName)
      setCustomerEmail(tenant.email)
    }
  }

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  }

  function addSuggestion(suggestion: { description: string; unitPrice: number }) {
    setItems([...items, { ...suggestion, quantity: 1 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) {
      toast.error("Selecteer een klant")
      return
    }
    setLoading(true)

    const data = {
      tenantId,
      type: "PLATFORM_FACTUUR" as const,
      customerName,
      customerEmail,
      vatRate,
      dueDate,
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    }

    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }

      toast.success("Platformfactuur aangemaakt")
      router.push("/admin/facturatie/platform")
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Form — left side */}
      <div className="lg:col-span-3">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/admin/facturatie/platform">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h3 className="font-semibold text-slate-900">Platformfactuur</h3>
          </div>

          {/* Tenant selection */}
          <div className="space-y-2">
            <Label>Klant</Label>
            <Select value={tenantId} onValueChange={handleTenantChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecteer een klant..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.companyName}
                    <span className="ml-2 text-xs text-slate-400">({t.plan})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-filled customer info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Factuurnaam</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Wordt automatisch ingevuld"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">E-mailadres</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Wordt automatisch ingevuld"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>BTW-tarief</Label>
              <Select value={vatRate} onValueChange={setVatRate}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VAT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vervaldatum</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Invoice items */}
          <div className="space-y-3">
            <Label>Factuurregels</Label>
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  placeholder="Omschrijving"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  className="flex-1"
                  required
                />
                <Input
                  type="number"
                  placeholder="Aantal"
                  value={item.quantity || ""}
                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-20"
                  min="0.01"
                  step="0.01"
                  required
                />
                <Input
                  type="number"
                  placeholder="Prijs"
                  value={item.unitPrice || ""}
                  onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  className="w-28"
                  min="0"
                  step="0.01"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= 1}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-3 w-3" />
                Regel toevoegen
              </Button>
            </div>
          </div>

          {/* Service suggestions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Snelle diensten
            </p>
            <div className="flex flex-wrap gap-2">
              {SERVICE_SUGGESTIONS.map((sug) => (
                <Button
                  key={sug.description}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => addSuggestion(sug)}
                >
                  {sug.description}
                </Button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Bezig met aanmaken..." : "Platformfactuur aanmaken"}
          </Button>
        </form>
      </div>

      {/* Live preview — right side */}
      <div className="lg:col-span-2 hidden lg:block">
        <div className="sticky top-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Live preview
          </p>
          <InvoicePreview
            companyName="AK Web Solutions"
            companyDomain="akwebsolutions.nl"
            customerName={customerName}
            customerEmail={customerEmail}
            items={items}
            vatRate={vatRate}
            subtotal={subtotal}
            vatAmount={vatAmount}
            total={total}
            dueDate={dueDate}
          />
        </div>
      </div>
    </div>
  )
}
