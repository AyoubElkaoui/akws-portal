import { renderEmailLayout } from "./layout"

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(date))
}

interface BookingConfirmationEmailProps {
  companyName: string
  customerName: string
  date: Date | string
  startTime: string
  endTime: string
}

export function renderBookingConfirmationEmail(props: BookingConfirmationEmailProps): string {
  const { companyName, customerName, date, startTime, endTime } = props

  const body = `
    <p>Beste ${customerName},</p>
    <p>Uw afspraak is bevestigd! Hieronder vindt u de details.</p>

    <div class="highlight">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:#64748b;">Datum</span>
        <strong>${formatDate(date)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:#64748b;">Tijd</span>
        <strong>${startTime} - ${endTime}</strong>
      </div>
    </div>

    <p>Wilt u de afspraak wijzigen of annuleren? Neem dan contact met ons op.</p>
    <p>Met vriendelijke groet,<br/>${companyName}</p>
  `

  return renderEmailLayout({ companyName, children: body })
}
