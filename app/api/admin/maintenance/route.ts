import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"

const createMaintenanceSchema = z.object({
  tenantId: z.string().min(1, "Klant is verplicht"),
  description: z.string().min(1, "Omschrijving is verplicht"),
  type: z.enum(["UPDATE", "BACKUP", "SECURITY"], { message: "Ongeldig type" }),
})

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = createMaintenanceSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const log = await db.maintenanceLog.create({
    data: {
      tenantId: parsed.data.tenantId,
      description: parsed.data.description,
      type: parsed.data.type,
    },
  })

  return success(log, 201)
}
