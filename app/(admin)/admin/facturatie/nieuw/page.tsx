import { requireAdmin } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { AdminCreateInvoiceForm } from "./admin-create-invoice-form"

export default async function AdminNieuweFactuurPage() {
  await requireAdmin()

  const tenants = await db.tenant.findMany({
    where: { active: true },
    select: { id: true, companyName: true, domain: true, logo: true },
    orderBy: { companyName: "asc" },
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Nieuwe factuur</h2>
        <p className="text-sm text-slate-500">
          Selecteer een tenant en vul de factuurgegevens in.
        </p>
      </div>
      <AdminCreateInvoiceForm tenants={tenants} />
    </div>
  )
}
