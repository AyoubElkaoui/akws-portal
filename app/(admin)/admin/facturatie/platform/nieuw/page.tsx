import { requireAdmin } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { PlatformInvoiceForm } from "./platform-invoice-form"

export default async function NieuwePlatformFactuurPage() {
  await requireAdmin()

  const tenants = await db.tenant.findMany({
    where: { active: true },
    select: {
      id: true,
      companyName: true,
      domain: true,
      logo: true,
      plan: true,
      users: {
        select: { email: true },
        take: 1,
      },
    },
    orderBy: { companyName: "asc" },
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Nieuwe platformfactuur</h2>
        <p className="text-sm text-slate-500">
          Factureer een klant voor hosting, onderhoud of andere diensten.
        </p>
      </div>
      <PlatformInvoiceForm
        tenants={tenants.map((t) => ({
          id: t.id,
          companyName: t.companyName,
          domain: t.domain,
          logo: t.logo,
          plan: t.plan,
          email: t.users[0]?.email || "",
        }))}
      />
    </div>
  )
}
