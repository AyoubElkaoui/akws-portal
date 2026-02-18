import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope, getTenant } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"
import { sendEmail } from "@/lib/email/service"
import { renderPaymentReminderEmail, getReminderSubject } from "@/lib/email/templates/payment-reminder"
import { notifyTenantUsers } from "@/lib/notifications"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      paymentReminders: { orderBy: { sentAt: "desc" } },
    },
  })

  if (!invoice) return notFound("Factuur")

  if (invoice.status !== "VERZONDEN" && invoice.status !== "VERLOPEN") {
    return error("Herinneringen kunnen alleen voor openstaande facturen worden verstuurd")
  }

  const reminderCount = invoice.paymentReminders.length
  let reminderType: "HERINNERING_1" | "HERINNERING_2" | "AANMANING"
  if (reminderCount === 0) {
    reminderType = "HERINNERING_1"
  } else if (reminderCount === 1) {
    reminderType = "HERINNERING_2"
  } else {
    reminderType = "AANMANING"
  }

  const tenant = await getTenant(user.tenantId)
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  await sendEmail({
    to: invoice.customerEmail,
    subject: getReminderSubject(reminderType, invoice.invoiceNumber),
    html: renderPaymentReminderEmail({
      companyName: tenant?.companyName || "",
      customerName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      dueDate: invoice.dueDate,
      reminderType,
      paymentUrl: `${baseUrl}/betaal/${id}`,
    }),
  })

  const reminder = await db.paymentReminder.create({
    data: {
      invoiceId: id,
      type: reminderType,
    },
  })

  await notifyTenantUsers(
    user.tenantId,
    "Betalingsherinnering verstuurd",
    `${reminderType.replace("_", " ")} verstuurd voor factuur ${invoice.invoiceNumber}`,
    `/dashboard/facturen/${id}`,
  )

  return success(reminder, 201)
}
