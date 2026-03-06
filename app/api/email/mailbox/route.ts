import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"
import { tenantScope } from "@/lib/db/tenant"
import { fetchInbox } from "@/lib/email/imap"

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const { searchParams } = req.nextUrl
  const accountId = searchParams.get("accountId")
  const folder = searchParams.get("folder") || "INBOX"

  if (!accountId) {
    return error("accountId is verplicht")
  }

  const account = await db.emailAccount.findFirst({
    where: { id: accountId, ...tenantScope(user.tenantId) },
  })

  if (!account) {
    return error("E-mailaccount niet gevonden", 404)
  }

  try {
    const messages = await fetchInbox(
      {
        host: account.imapHost,
        port: account.imapPort,
        username: account.username,
        password: account.password,
        tls: account.useTls,
      },
      folder,
      50,
    )

    return success(messages)
  } catch (err) {
    console.error("[Mailbox] Fout bij ophalen inbox:", err)
    return error("Kan inbox niet ophalen. Controleer de e-mailconfiguratie.")
  }
}
