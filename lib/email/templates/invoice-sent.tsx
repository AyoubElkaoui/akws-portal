import { renderEmailLayout } from "./layout"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date))
}

interface InvoiceSentEmailProps {
  companyName: string
  customerName: string
  invoiceNumber: string
  total: number
  dueDate: Date | string
  items: { description: string; quantity: number; unitPrice: number }[]
  vatRate: string
  subtotal: number
  vatAmount: number
  paymentUrl?: string
}

const vatLabels: Record<string, string> = {
  STANDAARD: "21%",
  LAAG: "9%",
  VRIJGESTELD: "0%",
}

export function renderInvoiceSentEmail(props: InvoiceSentEmailProps): string {
  const { companyName, customerName, invoiceNumber, total, dueDate, items, vatRate, subtotal, vatAmount, paymentUrl } = props

  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align:right">${item.quantity}</td>
      <td style="text-align:right">${formatCurrency(item.unitPrice)}</td>
      <td style="text-align:right">${formatCurrency(item.quantity * item.unitPrice)}</td>
    </tr>`
    )
    .join("")

  const body = `
    <p>Beste ${customerName},</p>
    <p>Hierbij ontvangt u factuur <strong>${invoiceNumber}</strong> van ${companyName}.</p>

    <table class="table">
      <thead>
        <tr>
          <th>Omschrijving</th>
          <th style="text-align:right">Aantal</th>
          <th style="text-align:right">Prijs</th>
          <th style="text-align:right">Totaal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div style="text-align:right; margin-top:16px;">
      <div style="display:inline-block; text-align:right;">
        <div style="padding:4px 0; font-size:13px; color:#64748b;">
          Subtotaal: <span style="margin-left:16px; color:#334155;">${formatCurrency(subtotal)}</span>
        </div>
        <div style="padding:4px 0; font-size:13px; color:#64748b;">
          BTW (${vatLabels[vatRate] || "0%"}): <span style="margin-left:16px; color:#334155;">${formatCurrency(vatAmount)}</span>
        </div>
        <div style="padding-top:8px; margin-top:4px; border-top:2px solid #0f172a; font-weight:700; font-size:16px; color:#0f172a;">
          Totaal: <span style="margin-left:16px;">${formatCurrency(total)}</span>
        </div>
      </div>
    </div>

    <div class="highlight mt-4">
      <strong>Vervaldatum:</strong> ${formatDate(dueDate)}
    </div>

    ${
      paymentUrl
        ? `<p class="mt-4" style="text-align:center;">
        <a href="${paymentUrl}" class="btn">Betaal nu</a>
      </p>`
        : ""
    }

    <p class="mt-4">Heeft u vragen over deze factuur? Neem gerust contact met ons op.</p>
    <p>Met vriendelijke groet,<br/>${companyName}</p>
  `

  return renderEmailLayout({ companyName, children: body })
}
