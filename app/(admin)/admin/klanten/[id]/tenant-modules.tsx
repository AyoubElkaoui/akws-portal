"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { MODULE_DEFINITIONS } from "@/types"
import type { Plan } from "@prisma/client"

interface ModuleInfo {
  id: string
  slug: string
  name: string
  description: string | null
  enabled: boolean
}

interface TenantModulesProps {
  tenantId: string
  tenantPlan: Plan
  modules: ModuleInfo[]
}

export function TenantModules({ tenantId, tenantPlan, modules }: TenantModulesProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleModule(moduleId: string, enabled: boolean) {
    setLoading(moduleId)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, enabled }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }
      toast.success(`Module ${enabled ? "ingeschakeld" : "uitgeschakeld"}`)
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Modules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const definition = MODULE_DEFINITIONS.find(
              (m) => m.slug === mod.slug
            )
            const includedInPlan = definition?.plans.includes(tenantPlan) ?? false

            return (
              <div
                key={mod.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {mod.name}
                    </p>
                    {includedInPlan && (
                      <Badge variant="secondary" className="text-xs">
                        In pakket
                      </Badge>
                    )}
                  </div>
                  {mod.description && (
                    <p className="text-xs text-slate-500">{mod.description}</p>
                  )}
                </div>
                <Switch
                  checked={mod.enabled}
                  disabled={loading === mod.id}
                  onCheckedChange={(checked) => toggleModule(mod.id, checked)}
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
