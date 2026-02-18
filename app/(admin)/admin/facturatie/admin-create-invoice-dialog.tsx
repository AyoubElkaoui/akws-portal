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
import { Plus, Trash2 } from "lucide-react"

interface Tenant {
  id: string
  companyName: string
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

export function AdminCreateInvoiceDialog({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState("")
  const [vatRate, setVatRate] = useState("STANDAARD")
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ])

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const vatAmount = subtotal * (VAT_PERCENTAGES[vatRate] ?? 0.21)
  const total = subtotal + vatAmount

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
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
      toast.error("Selecteer een klant (tenant)")
      return
    }
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const data = {
      tenantId,
      customerName: formData.get("customerName") as string,
      customerEmail: formData.get("customerEmail") as string,
      vatRate,
      dueDate: formData.get("dueDate") as string,
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

      toast.success("Factuur succesvol aangemaakt")
      setOpen(false)
      setItems([{ description: "", quantity: 1, unitPrice: 0 }])
      setVatRate("STANDAARD")
      setTenantId("")
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setLoading(false)
    }
  }

  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe factuur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Factuur aanmaken voor klant</DialogTitle>
          <DialogDescription>
            Selecteer een tenant en vul de factuurgegevens in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant selection */}
          <div className="space-y-2">
            <Label>Klant (tenant)</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecteer een klant..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Klantnaam (factuur)</Label>
              <Input
                id="customerName"
                name="customerName"
                placeholder="Naam op de factuur"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">E-mailadres</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                placeholder="klant@voorbeeld.nl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vatRate">BTW-tarief</Label>
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
              <Label htmlFor="dueDate">Vervaldatum</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={defaultDueDate}
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
                <span className="flex w-24 items-center justify-end text-sm text-slate-600">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
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
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 h-3 w-3" />
              Regel toevoegen
            </Button>
          </div>

          {/* Totals */}
          <div className="space-y-1 rounded-lg bg-slate-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotaal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">BTW ({VAT_LABELS[vatRate]})</span>
              <span>{formatCurrency(vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Totaal</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Bezig met aanmaken..." : "Factuur aanmaken"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
