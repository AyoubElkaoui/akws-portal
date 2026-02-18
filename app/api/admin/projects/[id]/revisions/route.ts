import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const updateRevisionSchema = z.object({
  revisionId: z.string().min(1),
  status: z.enum(["AANGEVRAAGD", "IN_BEHANDELING", "AFGEROND"]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = updateRevisionSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const revision = await db.revision.findUnique({ where: { id: parsed.data.revisionId } })
  if (!revision) return notFound("Revisie")

  const updated = await db.revision.update({
    where: { id: parsed.data.revisionId },
    data: { status: parsed.data.status },
  })

  return success(updated)
}
