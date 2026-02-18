import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const createNoteSchema = z.object({
  content: z.string().min(1, "Notitie mag niet leeg zijn"),
})

export async function POST(
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

  // Verify contact belongs to tenant
  const contact = await db.contact.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!contact) return notFound("Contact")

  const body = await req.json()
  const parsed = createNoteSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const note = await db.$transaction(async (tx) => {
    const newNote = await tx.contactNote.create({
      data: {
        contactId: id,
        content: parsed.data.content,
      },
    })

    // Update lastContactedAt
    await tx.contact.update({
      where: { id },
      data: { lastContactedAt: new Date() },
    })

    return newNote
  })

  return success(note, 201)
}
