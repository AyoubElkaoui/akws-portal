import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const addRecipientsSchema = z.object({
  contactIds: z.array(z.string()).optional(),
  emails: z.array(z.string().email()).optional(),
})

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
  })

  if (!campaign) return notFound("Campagne")

  if (campaign.status === "VERZONDEN") {
    return error("Kan geen ontvangers toevoegen aan een verzonden campagne")
  }

  const body = await req.json()
  const parsed = addRecipientsSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const recipients: { campaignId: string; contactId?: string; email: string }[] = []

  // Add from contact IDs
  if (parsed.data.contactIds?.length) {
    const contacts = await db.contact.findMany({
      where: {
        id: { in: parsed.data.contactIds },
        ...tenantScope(user.tenantId),
        email: { not: null },
      },
    })

    for (const contact of contacts) {
      if (contact.email) {
        recipients.push({
          campaignId: id,
          contactId: contact.id,
          email: contact.email,
        })
      }
    }
  }

  // Add manual email addresses
  if (parsed.data.emails?.length) {
    for (const email of parsed.data.emails) {
      recipients.push({ campaignId: id, email })
    }
  }

  if (recipients.length === 0) {
    return error("Geen geldige ontvangers gevonden")
  }

  // Remove existing recipients to avoid duplicates, then add new
  const existingEmails = (
    await db.emailRecipient.findMany({
      where: { campaignId: id },
      select: { email: true },
    })
  ).map((r) => r.email)

  const newRecipients = recipients.filter((r) => !existingEmails.includes(r.email))

  if (newRecipients.length > 0) {
    await db.emailRecipient.createMany({ data: newRecipients })
  }

  return success({ added: newRecipients.length })
}
