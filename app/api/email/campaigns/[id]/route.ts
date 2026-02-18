import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const updateCampaignSchema = z.object({
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  status: z.enum(["CONCEPT", "GEPLAND", "VERZONDEN"]).optional(),
})

export async function GET(
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

  const campaign = await db.emailCampaign.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
    include: {
      recipients: {
        include: { contact: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  if (!campaign) return notFound("Campagne")

  return success(campaign)
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
  const parsed = updateCampaignSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const campaign = await db.emailCampaign.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!campaign) return notFound("Campagne")

  if (campaign.status === "VERZONDEN") {
    return error("Verzonden campagnes kunnen niet meer worden bewerkt")
  }

  const updated = await db.emailCampaign.update({
    where: { id },
    data: parsed.data,
  })

  return success(updated)
}

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

  const campaign = await db.emailCampaign.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  })

  if (!campaign) return notFound("Campagne")

  if (campaign.status === "VERZONDEN") {
    return error("Verzonden campagnes kunnen niet worden verwijderd")
  }

  await db.emailCampaign.delete({ where: { id } })

  return success({ deleted: true })
}
