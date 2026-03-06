import nodemailer from "nodemailer"

interface SmtpConfig {
  host: string
  port: number
  username: string
  password: string
  tls: boolean
}

interface SendMailOptions {
  from: string
  fromName?: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
}

export async function sendViaSMTP(config: SmtpConfig, options: SendMailOptions) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.tls,
    auth: {
      user: config.username,
      pass: config.password,
    },
  })

  const result = await transporter.sendMail({
    from: options.fromName
      ? `${options.fromName} <${options.from}>`
      : options.from,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  return result
}

export async function testSmtpConnection(config: SmtpConfig): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.tls,
      auth: {
        user: config.username,
        pass: config.password,
      },
    })
    await transporter.verify()
    return true
  } catch {
    return false
  }
}
