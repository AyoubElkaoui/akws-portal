import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope, getTenant } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"
import { sendEmail } from "@/lib/email/service"
import { renderCampaignEmail } from "@/lib/email/templates/campaign"
import { notifyTenantUsers } from "@/lib/notifications"

export async function POST(
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
    include: { recipients: true },
  })

  if (!campaign) return notFound("Campagne")

  if (campaign.status === "VERZONDEN") {
    return error("Deze campagne is al verzonden")
  }

  if (campaign.recipients.length === 0) {
    return error("Voeg eerst ontvangers toe aan de campagne")
  }

  const tenant = await getTenant(user.tenantId)
  const companyName = tenant?.companyName || ""
  const html = renderCampaignEmail({ companyName, body: campaign.body })

  let sentCount = 0
  for (const recipient of campaign.recipients) {
    const result = await sendEmail({
      to: recipient.email,
      subject: campaign.subject,
      html,
    })
    if (result) sentCount++
  }

  const updated = await db.emailCampaign.update({
    where: { id },
    data: {
      status: "VERZONDEN",
      sentAt: new Date(),
      recipientCount: campaign.recipients.length,
    },
  })

  await notifyTenantUsers(
    user.tenantId,
    "Campagne verstuurd",
    `Campagne "${campaign.subject}" verstuurd naar ${sentCount} ontvanger(s)`,
    `/dashboard/email`,
  )

  return success(updated)
}
