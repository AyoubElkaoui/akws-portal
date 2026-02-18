import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope, getTenant } from "@/lib/db/tenant"
import { success, error, unauthorized } from "@/lib/api/response"
import { sendEmail } from "@/lib/email/service"
import { renderReviewRequestEmail } from "@/lib/email/templates/review-request"

const requestReviewSchema = z.object({
  customerEmail: z.string().email("Ongeldig e-mailadres"),
})

export async function GET() {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const requests = await db.reviewRequest.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { sentAt: "desc" },
  })

  return success(requests)
}

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = requestReviewSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const tenant = await getTenant(user.tenantId)
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  await sendEmail({
    to: parsed.data.customerEmail,
    subject: `${tenant?.companyName || ""} vraagt om uw review`,
    html: renderReviewRequestEmail({
      companyName: tenant?.companyName || "",
      customerEmail: parsed.data.customerEmail,
      reviewUrl: `${baseUrl}/review/${tenant?.slug || ""}`,
    }),
  })

  const request = await db.reviewRequest.create({
    data: {
      tenantId: user.tenantId,
      customerEmail: parsed.data.customerEmail,
    },
  })

  return success(request, 201)
}
