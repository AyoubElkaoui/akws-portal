import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized } from "@/lib/api/response"

const updateAvailabilitySchema = z.object({
  slots: z.array(
    z.object({
      id: z.string().optional(),
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      active: z.boolean(),
    })
  ),
})

export async function GET() {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const slots = await db.availabilitySlot.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  return success(slots)
}

export async function PUT(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = updateAvailabilitySchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  // Replace all availability slots
  await db.$transaction(async (tx) => {
    await tx.availabilitySlot.deleteMany({
      where: { ...tenantScope(user.tenantId) },
    })

    await tx.availabilitySlot.createMany({
      data: parsed.data.slots.map((slot) => ({
        tenantId: user.tenantId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        active: slot.active,
      })),
    })
  })

  const slots = await db.availabilitySlot.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  return success(slots)
}
