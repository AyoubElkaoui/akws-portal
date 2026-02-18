import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { success, error } from "@/lib/api/response"

export async function GET(req: NextRequest) {
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug")
  const dateStr = req.nextUrl.searchParams.get("date")

  if (!tenantSlug || !dateStr) {
    return error("tenantSlug en date zijn verplicht")
  }

  const tenant = await db.tenant.findUnique({
    where: { slug: tenantSlug },
  })

  if (!tenant) {
    return error("Bedrijf niet gevonden", 404)
  }

  const date = new Date(dateStr)
  const dayOfWeek = date.getDay() // 0=Sunday

  // Get availability slots for this day of week
  const availabilitySlots = await db.availabilitySlot.findMany({
    where: {
      tenantId: tenant.id,
      dayOfWeek,
      active: true,
    },
    orderBy: { startTime: "asc" },
  })

  // Get existing appointments for this date
  const startOfDay = new Date(dateStr)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(dateStr)
  endOfDay.setHours(23, 59, 59, 999)

  const existingAppointments = await db.appointment.findMany({
    where: {
      tenantId: tenant.id,
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: "GEANNULEERD" },
    },
  })

  const bookedTimes = new Set(existingAppointments.map((a) => a.startTime))

  // Generate 30-minute slots from availability and remove booked ones
  const slots: { startTime: string; endTime: string }[] = []

  for (const avail of availabilitySlots) {
    const [startH, startM] = avail.startTime.split(":").map(Number)
    const [endH, endM] = avail.endTime.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    for (let m = startMinutes; m + 30 <= endMinutes; m += 30) {
      const slotStart = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
      const slotEnd = `${String(Math.floor((m + 30) / 60)).padStart(2, "0")}:${String((m + 30) % 60).padStart(2, "0")}`

      if (!bookedTimes.has(slotStart)) {
        slots.push({ startTime: slotStart, endTime: slotEnd })
      }
    }
  }

  return success({ slots })
}
