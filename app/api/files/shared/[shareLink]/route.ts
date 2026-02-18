import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { success, error, notFound } from "@/lib/api/response"
import { getDownloadUrl, isR2Configured } from "@/lib/storage/r2"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareLink: string }> },
) {
  const { shareLink } = await params

  const file = await db.file.findUnique({
    where: { shareLink },
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
