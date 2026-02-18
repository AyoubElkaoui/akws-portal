import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { success, error } from "@/lib/api/response"
import { notifyTenantUsers } from "@/lib/notifications"

const reviewSchema = z.object({
  tenantSlug: z.string().min(1),
  customerName: z.string().min(1, "Naam is verplicht"),
  rating: z.number().min(1).max(5),
  text: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return error("Ongeldig verzoek")
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const { tenantSlug, customerName, rating, text } = parsed.data

  const tenant = await db.tenant.findUnique({
    where: { slug: tenantSlug },
  })

  if (!tenant) {
    return error("Bedrijf niet gevonden", 404)
  }

  const review = await db.review.create({
    data: {
      tenantId: tenant.id,
      customerName,
      rating,
      text: text || null,
      source: "MANUAL",
      verified: true,
    },
  })

  await notifyTenantUsers(
    tenant.id,
    "Nieuwe review ontvangen",
    `${customerName} heeft een ${rating}-sterren review achtergelaten`,
    "/dashboard/reviews"
  )

  return success(review, 201)
}
