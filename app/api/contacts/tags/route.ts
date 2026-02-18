import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized } from "@/lib/api/response"

const createTagSchema = z.object({
  name: z.string().min(1, "Tagnaam is verplicht"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ongeldige kleur").default("#3B82F6"),
})

export async function GET() {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const tags = await db.contactTag.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { name: "asc" },
    include: { _count: { select: { contacts: true } } },
  })

  return success(tags)
}

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = createTagSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  // Check for duplicate tag name
  const existing = await db.contactTag.findUnique({
    where: { tenantId_name: { tenantId: user.tenantId, name: parsed.data.name } },
  })

  if (existing) {
    return error("Er bestaat al een tag met deze naam")
  }

  const tag = await db.contactTag.create({
    data: {
      tenantId: user.tenantId,
      name: parsed.data.name,
      color: parsed.data.color,
    },
  })

  return success(tag, 201)
}
