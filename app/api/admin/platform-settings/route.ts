import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  logo: z.string().max(300000).nullable().optional(),
  address: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  kvkNumber: z.string().nullable().optional(),
  btwNumber: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),
})

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  let settings = await db.platformSettings.findUnique({
    where: { id: "platform" },
  })

  if (!settings) {
    settings = await db.platformSettings.create({
      data: { id: "platform" },
    })
  }

  return success(settings)
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const settings = await db.platformSettings.upsert({
    where: { id: "platform" },
    create: { id: "platform", ...parsed.data },
    update: parsed.data,
  })

  return success(settings)
}
