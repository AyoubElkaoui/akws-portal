import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized } from "@/lib/api/response"

const createCampaignSchema = z.object({
  subject: z.string().min(1, "Onderwerp is verplicht"),
  body: z.string().min(1, "Inhoud is verplicht"),
})

export async function GET() {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const campaigns = await db.emailCampaign.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { recipients: true } },
    },
  })

  return success(campaigns)
}

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = createCampaignSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const campaign = await db.emailCampaign.create({
    data: {
      tenantId: user.tenantId,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  })

  return success(campaign, 201)
}
