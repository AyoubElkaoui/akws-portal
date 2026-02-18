import { renderEmailLayout } from "./layout"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date))
}

interface PaymentConfirmationEmailProps {
  companyName: string
  customerName: string
  invoiceNumber: string
  total: number
  paidAt: Date | string
}

export function renderPaymentConfirmationEmail(props: PaymentConfirmationEmailProps): string {
  const { companyName, customerName, invoiceNumber, total, paidAt } = props

  const body = `
    <p>Beste ${customerName},</p>
    <p>Wij bevestigen hierbij de ontvangst van uw betaling. Hartelijk dank!</p>

    <div class="highlight">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:#64748b;">Factuurnummer</span>
        <strong>${invoiceNumber}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:#64748b;">Bedrag</span>
        <strong class="text-green">${formatCurrency(total)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span style="color:#64748b;">Betaald op</span>
        <strong>${formatDate(paidAt)}</strong>
      </div>
    </div>

    <p>Heeft u vragen? Neem gerust contact met ons op.</p>
    <p>Met vriendelijke groet,<br/>${companyName}</p>
  `

  return renderEmailLayout({ companyName, children: body })
}
