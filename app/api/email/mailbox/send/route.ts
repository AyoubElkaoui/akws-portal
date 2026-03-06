import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"
import { tenantScope } from "@/lib/db/tenant"
import { sendViaSMTP } from "@/lib/email/smtp"

const sendSchema = z.object({
  accountId: z.string().min(1),
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
})

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const account = await db.emailAccount.findFirst({
    where: { id: parsed.data.accountId, ...tenantScope(user.tenantId) },
  })

  if (!account) {
    return error("E-mailaccount niet gevonden", 404)
  }

  try {
    await sendViaSMTP(
      {
        host: account.smtpHost,
        port: account.smtpPort,
        username: account.username,
        password: account.password,
        tls: account.useTls,
      },
      {
        from: account.email,
        fromName: account.displayName || undefined,
        to: parsed.data.to,
        subject: parsed.data.subject,
        html: parsed.data.html,
        text: parsed.data.text,
      },
    )

    return success({ sent: true })
  } catch (err) {
    console.error("[Mailbox] Fout bij versturen:", err)
    return error("Kan e-mail niet versturen. Controleer de SMTP-configuratie.")
  }
}
