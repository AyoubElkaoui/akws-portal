import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { success, error } from "@/lib/api/response"
import { notifyTenantUsers } from "@/lib/notifications"
import { sendEmail } from "@/lib/email/service"
import { renderBookingConfirmationEmail } from "@/lib/email/templates/booking-confirmation"

const bookingSchema = z.object({
  tenantSlug: z.string().min(1),
  date: z.string().min(1, "Datum is verplicht"),
  startTime: z.string().min(1, "Starttijd is verplicht"),
  endTime: z.string().min(1, "Eindtijd is verplicht"),
  customerName: z.string().min(1, "Naam is verplicht"),
  customerEmail: z.string().email("Ongeldig e-mailadres"),
  customerPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return error("Ongeldig verzoek")
  }

  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const { tenantSlug, date, startTime, endTime, customerName, customerEmail, customerPhone, notes } = parsed.data

  const tenant = await db.tenant.findUnique({
    where: { slug: tenantSlug },
  })

  if (!tenant) {
    return error("Bedrijf niet gevonden", 404)
  }

  const appointment = await db.appointment.create({
    data: {
      tenantId: tenant.id,
      date: new Date(date),
      startTime,
      endTime,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      notes: notes || null,
      status: "BEVESTIGD",
    },
  })

  // Send confirmation email
  const html = renderBookingConfirmationEmail({
    companyName: tenant.companyName,
    customerName,
    date: new Date(date),
    startTime,
    endTime,
  })

  await sendEmail({
    to: customerEmail,
    subject: `Afspraakbevestiging - ${tenant.companyName}`,
    html,
  })

  // Notify tenant users
  await notifyTenantUsers(
    tenant.id,
    "Nieuwe afspraak",
    `${customerName} heeft een afspraak geboekt op ${new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long" }).format(new Date(date))} om ${startTime}`,
    "/dashboard/afspraken"
  )

  return success(appointment, 201)
}
