import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized } from "@/lib/api/response"

const createReviewSchema = z.object({
  customerName: z.string().min(1, "Klantnaam is verplicht"),
  rating: z.number().min(1).max(5),
  text: z.string().optional().or(z.literal("")),
  source: z.enum(["GOOGLE", "MANUAL"]).default("MANUAL"),
})

export async function GET() {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const reviews = await db.review.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { createdAt: "desc" },
    include: {
      testimonials: true,
    },
  })

  return success(reviews)
}

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = createReviewSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const review = await db.review.create({
    data: {
      tenantId: user.tenantId,
      customerName: parsed.data.customerName,
      rating: parsed.data.rating,
      text: parsed.data.text || null,
      source: parsed.data.source,
    },
  })

  return success(review, 201)
}
