import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const { id: tenantId, accountId } = await params

  const account = await db.emailAccount.findFirst({
    where: { id: accountId, tenantId },
  })

  if (!account) return notFound("E-mailaccount")

  await db.emailAccount.delete({ where: { id: accountId } })

  return success({ deleted: true })
}
