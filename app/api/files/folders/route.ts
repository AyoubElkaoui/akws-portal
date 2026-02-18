import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const createFolderSchema = z.object({
  name: z.string().min(1, "Mapnaam is verplicht"),
  parentId: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = createFolderSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const { name, parentId } = parsed.data

  // Verify parent folder belongs to tenant if provided
  if (parentId) {
    const parent = await db.folder.findFirst({
      where: { id: parentId, ...tenantScope(user.tenantId) },
    })
    if (!parent) {
      return error("Bovenliggende map niet gevonden")
    }
  }

  const folder = await db.folder.create({
    data: {
      tenantId: user.tenantId,
      name,
      parentId: parentId || null,
    },
    include: {
      _count: { select: { files: true, children: true } },
    },
  })

  return success(folder, 201)
}

export async function DELETE(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const searchParams = req.nextUrl.searchParams
  const folderId = searchParams.get("id")

  if (!folderId) {
    return error("Map-ID is verplicht")
  }

  const folder = await db.folder.findFirst({
    where: { id: folderId, ...tenantScope(user.tenantId) },
    include: { _count: { select: { files: true, children: true } } },
  })

  if (!folder) return notFound("Map")

  if (folder._count.files > 0 || folder._count.children > 0) {
    return error("Map is niet leeg. Verwijder eerst alle bestanden en submappen.")
  }

  await db.folder.delete({ where: { id: folderId } })

  return success({ deleted: true })
}
