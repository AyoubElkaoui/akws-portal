import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"
import { getDownloadUrl, isR2Configured } from "@/lib/storage/r2"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const file = await db.file.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!file) return notFound("Bestand")

  if (!isR2Configured()) {
    return error("Bestandsopslag is nog niet geconfigureerd", 503)
  }

  const downloadUrl = await getDownloadUrl(file.key)
  if (!downloadUrl) {
    return error("Kon geen download URL genereren")
  }

  return success({ downloadUrl, name: file.name })
}
