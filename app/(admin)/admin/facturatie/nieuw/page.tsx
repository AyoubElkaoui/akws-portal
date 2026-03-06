import { requireAdmin } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { AdminCreateInvoiceForm } from "./admin-create-invoice-form"

export default async function AdminNieuweFactuurPage() {
  await requireAdmin()

  const [tenants, platform] = await Promise.all([
    db.tenant.findMany({
      where: { active: true },
      select: { id: true, companyName: true, domain: true, logo: true },
      orderBy: { companyName: "asc" },
    }),
    db.platformSettings.findUnique({ where: { id: "platform" } }),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Nieuwe factuur</h2>
        <p className="text-sm text-slate-500">
          Selecteer een tenant en vul de factuurgegevens in.
        </p>
      </div>
      <AdminCreateInvoiceForm
        tenants={tenants}
        platform={platform ? {
          companyName: platform.companyName,
          logo: platform.logo,
          address: platform.address,
          postalCode: platform.postalCode,
          city: platform.city,
          phone: platform.phone,
          email: platform.email,
          website: platform.website,
          kvkNumber: platform.kvkNumber,
          btwNumber: platform.btwNumber,
          iban: platform.iban,
          bic: platform.bic,
        } : null}
      />
    </div>
  )
}
