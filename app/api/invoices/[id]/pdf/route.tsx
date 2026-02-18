import { NextRequest } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { unauthorized, notFound } from "@/lib/api/response"
import { InvoicePdf } from "@/lib/pdf/invoice-pdf"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const invoice = await db.invoice.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
    include: {
      invoiceItems: true,
      tenant: {
        select: {
          companyName: true, domain: true, logo: true,
          address: true, postalCode: true, city: true,
          phone: true, email: true, kvkNumber: true,
          btwNumber: true, iban: true, bic: true,
        },
      },
    },
  })

  if (!invoice) return notFound("Factuur")

  const buffer = await renderToBuffer(<InvoicePdf invoice={invoice} />)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  })
}
