import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getPayment } from "@/lib/payments/mollie"
import { sendEmail } from "@/lib/email/service"
import { renderPaymentConfirmationEmail } from "@/lib/email/templates/payment-confirmation"
import { notifyTenantUsers } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const id = params.get("id")

    if (!id) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const molliePayment = await getPayment(id)
    if (!molliePayment) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    if (molliePayment.status === "paid") {
      const invoice = await db.invoice.findFirst({
        where: { molliePaymentId: id },
        include: { tenant: true },
      })

      if (invoice && invoice.status !== "BETAALD") {
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "BETAALD",
            paidAt: new Date(),
          },
        })

        const html = renderPaymentConfirmationEmail({
          companyName: invoice.tenant.companyName,
          customerName: invoice.customerName,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          paidAt: new Date(),
        })

        await sendEmail({
          to: invoice.customerEmail,
          subject: `Betalingsbevestiging - ${invoice.invoiceNumber}`,
          html,
        })

        const formatted = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(invoice.total)
        await notifyTenantUsers(
          invoice.tenantId,
          "Betaling ontvangen",
          `Factuur ${invoice.invoiceNumber} is betaald door ${invoice.customerName} (${formatted})`,
          `/dashboard/facturen/${invoice.id}`
        )
      }
    }
  } catch (err) {
    console.error("[Mollie Webhook] Fout:", err)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
