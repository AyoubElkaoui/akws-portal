import { renderEmailLayout } from "./layout"

interface TicketNotificationEmailProps {
  companyName: string
  ticketSubject: string
  message: string
  ticketUrl: string
  isReply: boolean
  senderName: string
}

export function renderTicketNotificationEmail(props: TicketNotificationEmailProps): string {
  const { companyName, ticketSubject, message, ticketUrl, isReply, senderName } = props

  const title = isReply ? "Nieuw bericht op uw ticket" : "Nieuw supportticket ontvangen"

  const body = `
    <p><strong>${title}</strong></p>

    <div class="highlight">
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-size:12px;">Onderwerp</span><br/>
        <strong>${ticketSubject}</strong>
      </div>
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-size:12px;">Van</span><br/>
        <strong>${senderName}</strong>
      </div>
      <div>
        <span style="color:#64748b; font-size:12px;">Bericht</span><br/>
        <div style="margin-top:4px; white-space:pre-wrap;">${message.length > 500 ? message.substring(0, 500) + "..." : message}</div>
      </div>
    </div>

    <p style="text-align:center;" class="mt-4">
      <a href="${ticketUrl}" class="btn">Bekijk ticket</a>
    </p>

    <p>Met vriendelijke groet,<br/>${companyName}</p>
  `

  return renderEmailLayout({ companyName, children: body })
}
