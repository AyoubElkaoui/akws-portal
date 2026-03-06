import { ImapFlow } from "imapflow"

export interface MailMessage {
  id: string
  uid: number
  from: { name: string; address: string } | null
  to: string[]
  subject: string
  date: string
  seen: boolean
  snippet: string
}

export interface MailMessageFull extends MailMessage {
  html: string | null
  text: string | null
}

interface ImapConfig {
  host: string
  port: number
  username: string
  password: string
  tls: boolean
}

async function createClient(config: ImapConfig) {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.tls,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false,
  })
  await client.connect()
  return client
}

export async function fetchInbox(
  config: ImapConfig,
  folder: string = "INBOX",
  limit: number = 30,
): Promise<MailMessage[]> {
  const client = await createClient(config)
  const messages: MailMessage[] = []

  try {
    const lock = await client.getMailboxLock(folder)
    try {
      const status = await client.status(folder, { messages: true })
      const total = status.messages || 0
      if (total === 0) return []

      const start = Math.max(1, total - limit + 1)

      for await (const msg of client.fetch(`${start}:*`, {
        uid: true,
        envelope: true,
        flags: true,
        bodyStructure: true,
      })) {
        const from = msg.envelope?.from?.[0]
        const to = msg.envelope?.to?.map((t: { address?: string }) => t.address || "") || []

        messages.push({
          id: String(msg.uid),
          uid: msg.uid,
          from: from
            ? { name: from.name || "", address: from.address || "" }
            : null,
          to,
          subject: msg.envelope?.subject || "(geen onderwerp)",
          date: msg.envelope?.date?.toISOString() || new Date().toISOString(),
          seen: msg.flags?.has("\\Seen") || false,
          snippet: "",
        })
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }

  return messages.reverse()
}

export async function fetchMessage(
  config: ImapConfig,
  uid: number,
  folder: string = "INBOX",
): Promise<MailMessageFull | null> {
  const client = await createClient(config)

  try {
    const lock = await client.getMailboxLock(folder)
    try {
      const msg = await client.fetchOne(String(uid), {
        uid: true,
        envelope: true,
        flags: true,
        source: true,
      }, { uid: true })

      if (!msg) return null

      // Mark as seen
      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true })

      const from = msg.envelope?.from?.[0]
      const to = msg.envelope?.to?.map((t: { address?: string }) => t.address || "") || []

      // Parse the source to get text/html content
      const source = msg.source?.toString() || ""
      let html: string | null = null
      let text: string | null = null

      // Simple extraction from source
      const htmlMatch = source.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\.\r\n|$)/i)
      const textMatch = source.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\.\r\n|$)/i)

      if (htmlMatch) html = htmlMatch[1]
      if (textMatch) text = textMatch[1]
      if (!html && !text) text = source.split("\r\n\r\n").slice(1).join("\r\n\r\n")

      return {
        id: String(msg.uid),
        uid: msg.uid,
        from: from
          ? { name: from.name || "", address: from.address || "" }
          : null,
        to,
        subject: msg.envelope?.subject || "(geen onderwerp)",
        date: msg.envelope?.date?.toISOString() || new Date().toISOString(),
        seen: true,
        snippet: "",
        html,
        text,
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }
}

export async function getFolders(config: ImapConfig): Promise<string[]> {
  const client = await createClient(config)

  try {
    const list = await client.list()
    return list.map((f) => f.path)
  } finally {
    await client.logout()
  }
}

export async function testConnection(config: ImapConfig): Promise<boolean> {
  try {
    const client = await createClient(config)
    await client.logout()
    return true
  } catch {
    return false
  }
}
