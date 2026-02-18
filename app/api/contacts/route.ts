import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized } from "@/lib/api/response"

const createContactSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const searchParams = req.nextUrl.searchParams
  const search = searchParams.get("search")
  const tagId = searchParams.get("tag")

  const where: any = { ...tenantScope(user.tenantId) }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ]
  }

  if (tagId) {
    where.contactTags = { some: { tagId } }
  }

  const contacts = await db.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      contactTags: { include: { tag: true } },
      _count: { select: { contactNotes: true } },
    },
  })

  return success(contacts)
}

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = createContactSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const { firstName, lastName, email, phone, company, notes, tagIds } = parsed.data

  const contact = await db.contact.create({
    data: {
      tenantId: user.tenantId,
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      company: company || null,
      notes: notes || null,
      contactTags: tagIds?.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: {
      contactTags: { include: { tag: true } },
    },
  })

  return success(contact, 201)
}
