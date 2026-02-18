import { Resend } from "resend"

let resend: Resend | null = null

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const client = getResend()
  if (!client) {
    console.warn("[Email] RESEND_API_KEY niet ingesteld, e-mail overgeslagen")
    return null
  }

  try {
    const result = await client.emails.send({
      from: from || process.env.EMAIL_FROM || "AK Web Solutions <noreply@akwebsolutions.nl>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    return result
  } catch (err) {
    console.error("[Email] Fout bij versturen:", err)
    return null
  }
}
