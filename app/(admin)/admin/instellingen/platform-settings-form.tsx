"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2 } from "lucide-react"

interface PlatformSettingsData {
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

export function PlatformSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<PlatformSettingsData>({
    companyName: "AK Web Solutions",
    logo: null,
    address: null,
    postalCode: null,
    city: null,
    phone: null,
    email: null,
    website: null,
    kvkNumber: null,
    btwNumber: null,
    iban: null,
    bic: null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/admin/platform-settings")
      .then((res) => {
        if (!res.ok) throw new Error("Fout bij ophalen")
        return res.json()
      })
      .then((result) => {
        if (result.success && result.data) {
          setData(result.data)
        }
      })
      .catch(() => {
        // Settings not yet created, use defaults
      })
      .finally(() => setLoading(false))
  }, [])

  function update(field: keyof PlatformSettingsData, value: string | null) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 200 * 1024) {
      toast.error("Logo mag maximaal 200KB zijn")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      update("logo", reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }
      toast.success("Bedrijfsgegevens opgeslagen")
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bedrijfsgegevens (facturen)</CardTitle>
        <p className="text-sm text-slate-500">
          Deze gegevens verschijnen als afzender op alle facturen.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            {data.logo ? (
              <div className="relative">
                <img
                  src={data.logo}
                  alt="Logo"
                  className="h-16 w-16 rounded-lg border object-contain bg-white p-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    update("logo", null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-red-100 p-0.5 text-red-600 hover:bg-red-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
                <Upload className="h-5 w-5 text-slate-400" />
              </div>
            )}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {data.logo ? "Wijzig logo" : "Upload logo"}
              </Button>
              <p className="mt-1 text-xs text-slate-500">
                PNG, JPG of SVG. Max 200KB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleLogoSelect}
            />
          </div>
        </div>

        {/* Company info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Bedrijfsnaam</Label>
            <Input
              value={data.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="AK Web Solutions"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Adres</Label>
            <Input
              value={data.address || ""}
              onChange={(e) => update("address", e.target.value || null)}
              placeholder="Straatnaam 123"
            />
          </div>
          <div className="space-y-2">
            <Label>Postcode</Label>
            <Input
              value={data.postalCode || ""}
              onChange={(e) => update("postalCode", e.target.value || null)}
              placeholder="1234 AB"
            />
          </div>
          <div className="space-y-2">
            <Label>Plaats</Label>
            <Input
              value={data.city || ""}
              onChange={(e) => update("city", e.target.value || null)}
              placeholder="Amsterdam"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Telefoon</Label>
            <Input
              value={data.phone || ""}
              onChange={(e) => update("phone", e.target.value || null)}
              placeholder="+31 6 12345678"
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={data.email || ""}
              onChange={(e) => update("email", e.target.value || null)}
              placeholder="info@akwebsolutions.nl"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Website</Label>
            <Input
              value={data.website || ""}
              onChange={(e) => update("website", e.target.value || null)}
              placeholder="https://akwebsolutions.nl"
            />
          </div>
        </div>

        {/* Legal / financial */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>KvK-nummer</Label>
            <Input
              value={data.kvkNumber || ""}
              onChange={(e) => update("kvkNumber", e.target.value || null)}
              placeholder="12345678"
            />
          </div>
          <div className="space-y-2">
            <Label>BTW-nummer</Label>
            <Input
              value={data.btwNumber || ""}
              onChange={(e) => update("btwNumber", e.target.value || null)}
              placeholder="NL123456789B01"
            />
          </div>
          <div className="space-y-2">
            <Label>IBAN</Label>
            <Input
              value={data.iban || ""}
              onChange={(e) => update("iban", e.target.value || null)}
              placeholder="NL00 BANK 0000 0000 00"
            />
          </div>
          <div className="space-y-2">
            <Label>BIC</Label>
            <Input
              value={data.bic || ""}
              onChange={(e) => update("bic", e.target.value || null)}
              placeholder="BANKCODE"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Opslaan..." : "Bedrijfsgegevens opslaan"}
        </Button>
      </CardContent>
    </Card>
  )
}
