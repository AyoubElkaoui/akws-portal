"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, X } from "lucide-react";

interface TenantFormProps {
  companyName: string;
  domain: string | null;
  primaryColor: string;
  logo: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  kvkNumber: string | null;
  btwNumber: string | null;
  iban: string | null;
  bic: string | null;
}

const MAX_FILE_SIZE = 200 * 1024; // 200KB

export function TenantForm({
  companyName,
  domain,
  primaryColor,
  logo: initialLogo,
  address,
  postalCode,
  city,
  phone,
  email,
  kvkNumber,
  btwNumber,
  iban,
  bic,
}: TenantFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState(primaryColor);
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecteer een afbeelding (PNG, JPG, SVG)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Afbeelding is te groot (max 200KB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/settings/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.get("companyName"),
          domain: formData.get("domain"),
          primaryColor: color,
          logo: logo,
          address: formData.get("address"),
          postalCode: formData.get("postalCode"),
          city: formData.get("city"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          kvkNumber: formData.get("kvkNumber"),
          btwNumber: formData.get("btwNumber"),
          iban: formData.get("iban"),
          bic: formData.get("bic"),
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      toast.success("Bedrijfsgegevens bijgewerkt");
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Bedrijfsgegevens</CardTitle>
        <CardDescription>
          Je bedrijfsinformatie, branding en factuurgegevens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Bedrijfsnaam</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={companyName}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Website domein</Label>
              <Input
                id="domain"
                name="domain"
                defaultValue={domain || ""}
                placeholder="voorbeeld.nl"
              />
            </div>
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="relative">
                  <img
                    src={logo}
                    alt="Logo preview"
                    className="h-16 w-16 rounded-lg border object-contain bg-white p-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogo(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
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
                  {logo ? "Wijzig logo" : "Upload logo"}
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

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Huisstijlkleur</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-28 font-mono text-sm"
              />
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3">Adresgegevens</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={address || ""}
                  placeholder="Straatnaam 123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postcode</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  defaultValue={postalCode || ""}
                  placeholder="1234 AB"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Plaats</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={city || ""}
                  placeholder="Amsterdam"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3">Contactgegevens</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefoonnummer</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={phone || ""}
                  placeholder="020-1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={email || ""}
                  placeholder="info@bedrijf.nl"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Business registration */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-1">Registratiegegevens</h4>
            <p className="text-xs text-slate-500 mb-3">
              Deze gegevens worden getoond op je facturen.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kvkNumber">KvK-nummer</Label>
                <Input
                  id="kvkNumber"
                  name="kvkNumber"
                  defaultValue={kvkNumber || ""}
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="btwNumber">BTW-nummer</Label>
                <Input
                  id="btwNumber"
                  name="btwNumber"
                  defaultValue={btwNumber || ""}
                  placeholder="NL123456789B01"
                />
              </div>
            </div>
          </div>

          {/* Bank details */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-1">Bankgegevens</h4>
            <p className="text-xs text-slate-500 mb-3">
              Wordt getoond op facturen zodat klanten direct kunnen betalen.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  name="iban"
                  defaultValue={iban || ""}
                  placeholder="NL91 ABNA 0417 1643 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bic">BIC</Label>
                <Input
                  id="bic"
                  name="bic"
                  defaultValue={bic || ""}
                  placeholder="ABNANL2A"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Opslaan..." : "Opslaan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
