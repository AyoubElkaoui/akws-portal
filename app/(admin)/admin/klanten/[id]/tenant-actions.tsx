"use client";

import { useState } from "react";
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
import type { Plan } from "@prisma/client";

interface TenantActionsProps {
  tenant: {
    id: string;
    plan: Plan;
    active: boolean;
    domain: string | null;
  };
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const router = useRouter();
  const [plan, setPlan] = useState(tenant.plan);
  const [domain, setDomain] = useState(tenant.domain || "");
  const [loading, setLoading] = useState(false);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
