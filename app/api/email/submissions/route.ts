import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized } from "@/lib/api/response"

export async function GET() {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const submissions = await db.formSubmission.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { createdAt: "desc" },
  })

  return success(submissions)
}

export async function PATCH(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const { id } = body

  if (!id) return error("ID is verplicht")

  const submission = await db.formSubmission.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!submission) return error("Inzending niet gevonden", 404)

  const updated = await db.formSubmission.update({
    where: { id },
    data: { read: true },
  })

  return success(updated)
}
