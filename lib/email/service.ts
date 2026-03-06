import nodemailer from "nodemailer"

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_TLS !== "false",
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn("[Email] SMTP niet geconfigureerd, e-mail overgeslagen")
    return null
  }

  const fromName = process.env.SMTP_FROM_NAME || "AK Web Solutions"
  const fromEmail = from || process.env.SMTP_FROM || "noreply@akwebsolutions.nl"

  try {
    const result = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    })
    return result
  } catch (err) {
    console.error("[Email] Fout bij versturen:", err)
    return null
  }
}
