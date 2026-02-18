import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["OFFERTE", "ACTIEF", "AFGEROND", "GEPAUZEERD"]).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
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

  const { id } = await params
  const body = await req.json()
  const parsed = updateProjectSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return notFound("Project")

  const updateData: any = { ...parsed.data }
  if (updateData.startDate !== undefined) {
    updateData.startDate = updateData.startDate ? new Date(updateData.startDate) : null
  }
  if (updateData.endDate !== undefined) {
    updateData.endDate = updateData.endDate ? new Date(updateData.endDate) : null
  }

  const updated = await db.project.update({
    where: { id },
    data: updateData,
  })

  return success(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return notFound("Project")

  await db.project.delete({ where: { id } })

  return success({ deleted: true })
}
