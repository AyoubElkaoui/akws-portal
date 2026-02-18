import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres"),
})

export async function PATCH(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  // Check email uniqueness
  if (parsed.data.email !== user.email) {
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
    })
    if (existing) {
      return error("Dit e-mailadres is al in gebruik")
    }
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
    },
  })

  return success({ name: updated.name, email: updated.email })
}
