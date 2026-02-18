import { NextRequest } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { unauthorized, notFound } from "@/lib/api/response"
import { InvoicePdf } from "@/lib/pdf/invoice-pdf"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
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
