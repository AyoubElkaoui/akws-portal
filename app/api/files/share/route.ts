import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"
import crypto from "crypto"

const shareSchema = z.object({
  fileId: z.string().min(1, "Bestands-ID is verplicht"),
})

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = shareSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const file = await db.file.findFirst({
    where: { id: parsed.data.fileId, ...tenantScope(user.tenantId) },
  })

  if (!file) return notFound("Bestand")

  // Generate or return existing share link
  if (file.shareLink) {
    return success({ shareLink: file.shareLink })
  }

  const shareLink = crypto.randomBytes(16).toString("hex")

  await db.file.update({
    where: { id: file.id },
    data: { shareLink },
  })

  return success({ shareLink })
}

export async function DELETE(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const searchParams = req.nextUrl.searchParams
  const fileId = searchParams.get("fileId")

  if (!fileId) {
    return error("Bestands-ID is verplicht")
  }

  const file = await db.file.findFirst({
    where: { id: fileId, ...tenantScope(user.tenantId) },
  })

  if (!file) return notFound("Bestand")

  await db.file.update({
    where: { id: file.id },
    data: { shareLink: null },
  })

  return success({ deleted: true })
}
