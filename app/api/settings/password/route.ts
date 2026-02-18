import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"
import { compare, hash } from "bcryptjs"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Huidig wachtwoord is verplicht"),
  newPassword: z.string().min(6, "Nieuw wachtwoord moet minimaal 6 tekens zijn"),
})

export async function PATCH(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = changePasswordSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return unauthorized()

  const isValid = await compare(parsed.data.currentPassword, dbUser.password)
  if (!isValid) {
    return error("Huidig wachtwoord is onjuist")
  }

  const hashedPassword = await hash(parsed.data.newPassword, 12)

  await db.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  return success({ updated: true })
}
