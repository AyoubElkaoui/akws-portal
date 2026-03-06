import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { success, error, unauthorized, notFound } from "@/lib/api/response"
import { tenantScope } from "@/lib/db/tenant"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const account = await db.emailAccount.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!account) return notFound("E-mailaccount")

  await db.emailAccount.delete({ where: { id } })

  return success({ deleted: true })
}
