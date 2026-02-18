import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const updateAppointmentSchema = z.object({
  status: z.enum(["BEVESTIGD", "GEANNULEERD", "AFGEROND"]).optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export async function PATCH(
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
  const body = await req.json()
  const parsed = updateAppointmentSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const appointment = await db.appointment.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!appointment) return notFound("Afspraak")

  const updateData: any = { ...parsed.data }
  if (updateData.date) updateData.date = new Date(updateData.date)

  const updated = await db.appointment.update({
    where: { id },
    data: updateData,
  })

  return success(updated)
}

export async function DELETE(
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

  const appointment = await db.appointment.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!appointment) return notFound("Afspraak")

  await db.appointment.delete({ where: { id } })

  return success({ deleted: true })
}
