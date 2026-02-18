import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { success, error, notFound } from "@/lib/api/response"
import { createPayment, isMollieConfigured } from "@/lib/payments/mollie"

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Factuur-ID is verplicht"),
})

export async function POST(req: NextRequest) {
  if (!isMollieConfigured()) {
    return error("Betalingen zijn momenteel niet beschikbaar", 503)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return error("Ongeldig verzoek")
  }

  const parsed = paymentSchema.safeParse(body)
  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const { invoiceId } = parsed.data

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: true },
  })

  if (!invoice) {
    return notFound("Factuur")
  }

  if (invoice.status !== "VERZONDEN" && invoice.status !== "VERLOPEN") {
    return error("Deze factuur kan niet betaald worden")
  }

  const redirectUrl = `${process.env.NEXTAUTH_URL}/betaal/${invoiceId}?status=success`

  const payment = await createPayment({
    invoiceId: invoice.id,
    amount: invoice.total,
    description: `Factuur ${invoice.invoiceNumber} - ${invoice.tenant.companyName}`,
    redirectUrl,
  })

  if (!payment) {
    return error("Betaling kon niet worden aangemaakt", 500)
  }

  await db.invoice.update({
    where: { id: invoice.id },
    data: { molliePaymentId: payment.id },
  })

  const checkoutUrl = payment._links?.checkout?.href
  if (!checkoutUrl) {
    return error("Geen checkout URL ontvangen van Mollie", 500)
  }

  return success({ checkoutUrl })
}
