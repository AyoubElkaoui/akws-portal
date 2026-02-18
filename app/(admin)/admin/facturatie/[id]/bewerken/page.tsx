import { redirect, notFound } from "next/navigation"
import { requireAdmin } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { AdminEditInvoiceForm } from "./admin-edit-invoice-form"

export default async function AdminBewerkenFactuurPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()

  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      invoiceItems: true,
      tenant: { select: { companyName: true, domain: true, logo: true } },
    },
  })

  if (!invoice) notFound()

  if (invoice.status !== "CONCEPT") {
    redirect(`/admin/facturatie/${id}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Factuur bewerken</h2>
        <p className="text-sm text-slate-500">
          {invoice.invoiceNumber} — {invoice.tenant.companyName}
        </p>
      </div>
      <AdminEditInvoiceForm
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
        companyName={invoice.tenant.companyName}
        companyDomain={invoice.tenant.domain}
        companyLogo={invoice.tenant.logo}
      />
    </div>
  )
}
