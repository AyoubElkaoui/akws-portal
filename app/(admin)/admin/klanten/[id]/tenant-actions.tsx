"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import type { Plan } from "@prisma/client";

interface TenantActionsProps {
  tenant: {
    id: string;
    plan: Plan;
    active: boolean;
    domain: string | null;
    logo: string | null;
  };
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const router = useRouter();
  const [plan, setPlan] = useState(tenant.plan);
  const [domain, setDomain] = useState(tenant.domain || "");
  const [logo, setLogo] = useState<string | null>(tenant.logo);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function updateTenant(data: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }
      toast.success("Klant bijgewerkt");
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      toast.error("Logo mag maximaal 200KB zijn");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo upload */}
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            {logo ? (
              <div className="relative">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-14 w-14 rounded-lg border object-contain bg-white p-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogo(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-red-100 p-0.5 text-red-600 hover:bg-red-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
                <Upload className="h-4 w-4 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
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
          <Button
            size="sm"
            className="w-full"
            disabled={loading || logo === tenant.logo}
            onClick={() => updateTenant({ logo })}
          >
            Logo opslaan
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Website / Domein</Label>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="https://voorbeeld.nl"
          />
          <Button
            size="sm"
            className="w-full"
            disabled={loading || domain === (tenant.domain || "")}
            onClick={() => updateTenant({ domain: domain || null })}
          >
            Domein opslaan
          </Button>
          <p className="text-xs text-slate-500">
            Bij opslaan wordt de website automatisch gekoppeld voor monitoring.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Pakket wijzigen</Label>
          <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STARTER">Starter — €29/mnd</SelectItem>
              <SelectItem value="BUSINESS">Business — €59/mnd</SelectItem>
              <SelectItem value="PREMIUM">Premium — €99/mnd</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="w-full"
            disabled={loading || plan === tenant.plan}
            onClick={() => updateTenant({ plan })}
          >
            Pakket opslaan
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Button
            variant={tenant.active ? "destructive" : "default"}
            size="sm"
            className="w-full"
            disabled={loading}
            onClick={() => updateTenant({ active: !tenant.active })}
          >
            {tenant.active ? "Deactiveren" : "Activeren"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
