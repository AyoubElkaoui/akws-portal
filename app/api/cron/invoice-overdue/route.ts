import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { success, error } from "@/lib/api/response"
import { sendEmail } from "@/lib/email/service"
import { renderPaymentReminderEmail, getReminderSubject } from "@/lib/email/templates/payment-reminder"
import { notifyTenantUsers } from "@/lib/notifications"

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return error("Niet geautoriseerd", 401)
    }
  }

  try {
    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: "VERZONDEN",
        dueDate: { lt: new Date() },
      },
      include: { tenant: true },
    })

    if (overdueInvoices.length > 0) {
      await db.invoice.updateMany({
        where: {
          id: { in: overdueInvoices.map((inv) => inv.id) },
        },
        data: { status: "VERLOPEN" },
      })
    }

    for (const invoice of overdueInvoices) {
      const paymentUrl = `${process.env.NEXTAUTH_URL}/betaal/${invoice.id}`

      const html = renderPaymentReminderEmail({
        companyName: invoice.tenant.companyName,
        customerName: invoice.customerName,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        dueDate: invoice.dueDate,
        reminderType: "HERINNERING_1",
        paymentUrl,
      })

      const subject = getReminderSubject("HERINNERING_1", invoice.invoiceNumber)

      await sendEmail({
        to: invoice.customerEmail,
        subject,
        html,
      })

      await db.paymentReminder.create({
        data: {
          invoiceId: invoice.id,
          type: "HERINNERING_1",
        },
      })

      await notifyTenantUsers(
        invoice.tenantId,
        "Factuur verlopen",
        `Factuur ${invoice.invoiceNumber} voor ${invoice.customerName} is verlopen. Een herinnering is automatisch verstuurd.`,
        `/dashboard/facturen/${invoice.id}`
      )
    }

    return success({
      updated: overdueInvoices.length,
      message: `${overdueInvoices.length} facturen bijgewerkt naar verlopen`,
    })
  } catch (err) {
    console.error("[Cron] Fout bij verwerken verlopen facturen:", err)
    return error("Fout bij verwerken verlopen facturen", 500)
  }
}
