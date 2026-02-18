import { redirect, notFound } from "next/navigation"
import { requireTenant } from "@/lib/api/auth"
import { isModuleEnabled, getTenant, tenantScope } from "@/lib/db/tenant"
import { db } from "@/lib/db"
import { EditInvoiceForm } from "./edit-invoice-form"

export default async function BewerkenFactuurPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireTenant()

  if (!(await isModuleEnabled(user.tenantId, "facturatie"))) {
    redirect("/dashboard")
  }

  const { id } = await params

  const [invoice, tenant] = await Promise.all([
    db.invoice.findFirst({
      where: { id, ...tenantScope(user.tenantId) },
      include: { invoiceItems: true },
    }),
    getTenant(user.tenantId),
  ])

  if (!invoice || !tenant) notFound()

  if (invoice.status !== "CONCEPT") {
    redirect(`/dashboard/facturen/${id}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Factuur bewerken</h2>
        <p className="text-sm text-slate-500">
          {invoice.invoiceNumber} — Wijzig de gegevens. De preview wordt automatisch bijgewerkt.
        </p>
      </div>
      <EditInvoiceForm
        invoice={{
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail,
          vatRate: invoice.vatRate,
          dueDate: invoice.dueDate.toISOString().split("T")[0],
          createdAt: invoice.createdAt.toISOString(),
          items: invoice.invoiceItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }}
        companyName={tenant.companyName}
        companyDomain={tenant.domain}
        companyLogo={tenant.logo}
      />
    </div>
  )
}
