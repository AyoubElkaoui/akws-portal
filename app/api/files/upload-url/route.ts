import { NextRequest } from "next/server"
import { z } from "zod"
import { requireTenant } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"
import { getUploadUrl, isR2Configured } from "@/lib/storage/r2"

const uploadUrlSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().max(50 * 1024 * 1024, "Bestand is te groot (max 50MB)"),
})

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  if (!isR2Configured()) {
    return error("Bestandsopslag is nog niet geconfigureerd", 503)
  }

  const body = await req.json()
  const parsed = uploadUrlSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const { name, mimeType } = parsed.data
  const key = `${user.tenantId}/${Date.now()}-${name}`
  const uploadUrl = await getUploadUrl(key, mimeType)

  if (!uploadUrl) {
    return error("Kon geen upload URL genereren")
  }

  return success({ uploadUrl, key })
}
