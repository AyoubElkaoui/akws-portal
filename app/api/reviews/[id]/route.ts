import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

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

  const review = await db.review.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!review) return notFound("Review")

  await db.review.delete({ where: { id } })

  return success({ deleted: true })
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

  const review = await db.review.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!review) return notFound("Review")

  // Toggle testimonial (display on website)
  if (body.toggleTestimonial) {
    const existing = await db.testimonial.findFirst({
      where: { reviewId: id, tenantId: user.tenantId },
    })

    if (existing) {
      await db.testimonial.delete({ where: { id: existing.id } })
      return success({ testimonial: false })
    } else {
      await db.testimonial.create({
        data: {
          tenantId: user.tenantId,
          reviewId: id,
          displayOnWebsite: true,
        },
      })
      return success({ testimonial: true })
    }
  }

  return success(review)
}
