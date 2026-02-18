import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const updateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const contact = await db.contact.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
    include: {
      contactTags: { include: { tag: true } },
      contactNotes: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!contact) return notFound("Contact")

  return success(contact)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateContactSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const contact = await db.contact.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!contact) return notFound("Contact")

  const { tagIds, ...updateData } = parsed.data

  // Clean empty strings to null
  const cleanData: any = {}
  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      cleanData[key] = value === "" ? null : value
    }
  }

  const updated = await db.$transaction(async (tx) => {
    // Update tags if provided
    if (tagIds !== undefined) {
      await tx.contactTagLink.deleteMany({ where: { contactId: id } })
      if (tagIds.length > 0) {
        await tx.contactTagLink.createMany({
          data: tagIds.map((tagId) => ({ contactId: id, tagId })),
        })
      }
    }

    return tx.contact.update({
      where: { id },
      data: cleanData,
      include: {
        contactTags: { include: { tag: true } },
        contactNotes: { orderBy: { createdAt: "desc" } },
      },
    })
  })

  return success(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const contact = await db.contact.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!contact) return notFound("Contact")

  await db.contact.delete({ where: { id } })

  return success({ deleted: true })
}
