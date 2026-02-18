import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const createRevisionSchema = z.object({
  description: z.string().min(1, "Beschrijving is verplicht"),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const { id: projectId } = await params

  // Verify the project exists and belongs to the tenant
  const project = await db.project.findUnique({
    where: { id: projectId },
  })

  if (!project || project.tenantId !== user.tenantId) {
    return notFound("Project")
  }

  const body = await req.json()
  const parsed = createRevisionSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const revision = await db.revision.create({
    data: {
      projectId,
      description: parsed.data.description,
      status: "AANGEVRAAGD",
    },
  })

  return success(revision, 201)
}
