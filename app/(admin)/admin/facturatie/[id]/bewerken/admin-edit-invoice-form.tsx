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

interface InvoiceData {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  vatRate: string
  dueDate: string
  createdAt: string
  items: InvoiceItem[]
}

interface PlatformInfo {
  companyName: string
  logo: string | null
  address: string | null
  postalCode: string | null
  city: string | null
  phone: string | null
  email: string | null
  website: string | null
  kvkNumber: string | null
  btwNumber: string | null
  iban: string | null
  bic: string | null
}

interface AdminEditInvoiceFormProps {
  invoice: InvoiceData
  tenantCompanyName: string
  platform: PlatformInfo | null
}

export function AdminEditInvoiceForm({
  invoice,
  tenantCompanyName,
  platform,
}: AdminEditInvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customerName, setCustomerName] = useState(invoice.customerName)
  const [customerEmail, setCustomerEmail] = useState(invoice.customerEmail)
  const [vatRate, setVatRate] = useState(invoice.vatRate)
  const [dueDate, setDueDate] = useState(invoice.dueDate)
  const [items, setItems] = useState<InvoiceItem[]>(invoice.items)

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
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          vatRate,
          dueDate,
          items: items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }

      toast.success("Factuur bijgewerkt")
      router.push(`/admin/facturatie/${invoice.id}`)
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
              <Link href={`/admin/facturatie/${invoice.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h3 className="font-semibold text-slate-900">Factuurgegevens</h3>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Klantnaam (factuur)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
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
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 h-3 w-3" />
              Regel toevoegen
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Opslaan..." : "Wijzigingen opslaan"}
          </Button>
        </form>
      </div>

      {/* Live preview — right side (AK Web Solutions as sender) */}
      <div className="lg:col-span-2 hidden lg:block">
        <div className="sticky top-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Live preview
          </p>
          <InvoicePreview
            companyName={platform?.companyName || "AK Web Solutions"}
            companyDomain={platform?.website}
            companyLogo={platform?.logo}
            companyAddress={platform?.address}
            companyPostalCode={platform?.postalCode}
            companyCity={platform?.city}
            companyPhone={platform?.phone}
            companyEmail={platform?.email}
            companyKvk={platform?.kvkNumber}
            companyBtw={platform?.btwNumber}
            companyIban={platform?.iban}
            companyBic={platform?.bic}
            customerName={customerName || tenantCompanyName}
            customerEmail={customerEmail}
            items={items}
            vatRate={vatRate}
            subtotal={subtotal}
            vatAmount={vatAmount}
            total={total}
            dueDate={dueDate}
            invoiceNumber={invoice.invoiceNumber}
            createdAt={invoice.createdAt}
          />
        </div>
      </div>
    </div>
  )
}
