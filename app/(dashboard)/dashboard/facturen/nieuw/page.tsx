import { redirect } from "next/navigation"
import { requireTenant } from "@/lib/api/auth"
import { isModuleEnabled } from "@/lib/db/tenant"
import { getTenant } from "@/lib/db/tenant"
import { CreateInvoiceForm } from "./create-invoice-form"

export default async function NieuweFactuurPage() {
  const user = await requireTenant()

  if (!(await isModuleEnabled(user.tenantId, "facturatie"))) {
    redirect("/dashboard")
  }

  const tenant = await getTenant(user.tenantId)
  if (!tenant) redirect("/dashboard")

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Nieuwe factuur</h2>
        <p className="text-sm text-slate-500">
          Vul de gegevens in. De preview wordt automatisch bijgewerkt.
        </p>
      </div>
      <CreateInvoiceForm
        companyName={tenant.companyName}
        companyDomain={tenant.domain}
        companyLogo={tenant.logo}
      />
    </div>
  )
}
