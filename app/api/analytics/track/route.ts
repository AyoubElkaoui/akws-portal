import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { success, error } from "@/lib/api/response"

const trackSchema = z.object({
  tenantId: z.string().min(1),
  page: z.string().min(1),
  referrer: z.string().optional(),
  device: z.string().optional(),
})

// Public endpoint — no auth required
export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = trackSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  // Verify tenant exists
  const tenant = await db.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    select: { id: true, active: true },
  })

  if (!tenant || !tenant.active) {
    return error("Tenant niet gevonden", 404)
  }

  await db.pageView.create({
    data: {
      tenantId: parsed.data.tenantId,
      page: parsed.data.page,
      referrer: parsed.data.referrer || null,
      device: parsed.data.device || null,
    },
  })

  return success({ tracked: true })
}
