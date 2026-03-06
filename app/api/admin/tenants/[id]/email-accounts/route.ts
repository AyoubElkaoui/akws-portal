import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"
import { testConnection } from "@/lib/email/imap"
import { testSmtpConnection } from "@/lib/email/smtp"

const createSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  imapHost: z.string().min(1),
  imapPort: z.number().default(993),
  smtpHost: z.string().min(1),
  smtpPort: z.number().default(465),
  username: z.string().min(1),
  password: z.string().min(1),
  useTls: z.boolean().default(true),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const { id: tenantId } = await params

  const accounts = await db.emailAccount.findMany({
    where: { tenantId },
    select: {
      id: true,
      email: true,
      displayName: true,
      imapHost: true,
      imapPort: true,
      smtpHost: true,
      smtpPort: true,
      username: true,
      useTls: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return success(accounts)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const { id: tenantId } = await params

  // Verify tenant exists
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) {
    return error("Klant niet gevonden", 404)
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  // Test IMAP connection
  const imapOk = await testConnection({
    host: parsed.data.imapHost,
    port: parsed.data.imapPort,
    username: parsed.data.username,
    password: parsed.data.password,
    tls: parsed.data.useTls,
  })

  if (!imapOk) {
    return error("Kan geen verbinding maken met IMAP server. Controleer de gegevens.")
  }

  // Test SMTP connection
  const smtpOk = await testSmtpConnection({
    host: parsed.data.smtpHost,
    port: parsed.data.smtpPort,
    username: parsed.data.username,
    password: parsed.data.password,
    tls: parsed.data.useTls,
  })

  if (!smtpOk) {
    return error("Kan geen verbinding maken met SMTP server. Controleer de gegevens.")
  }

  const account = await db.emailAccount.create({
    data: {
      tenantId,
      ...parsed.data,
    },
  })

  return success(account)
}
