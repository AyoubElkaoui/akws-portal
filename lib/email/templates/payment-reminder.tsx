import { renderEmailLayout } from "./layout"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date))
}

interface PaymentReminderEmailProps {
  companyName: string
  customerName: string
  invoiceNumber: string
  total: number
  dueDate: Date | string
  reminderType: "HERINNERING_1" | "HERINNERING_2" | "AANMANING"
  paymentUrl?: string
}

const reminderConfig = {
  HERINNERING_1: {
    subject: "Herinnering: factuur nog niet betaald",
    greeting: "Vriendelijke herinnering",
    message:
      "Wij hebben geconstateerd dat onderstaande factuur nog niet is voldaan. Mogelijk is deze aan uw aandacht ontsnapt. Wij verzoeken u vriendelijk het openstaande bedrag zo spoedig mogelijk over te maken.",
    urgency: "",
  },
  HERINNERING_2: {
    subject: "Tweede herinnering: factuur nog niet betaald",
    greeting: "Tweede herinnering",
    message:
      "Ondanks onze eerdere herinnering hebben wij nog geen betaling ontvangen voor onderstaande factuur. Wij verzoeken u dringend het openstaande bedrag binnen 7 dagen te voldoen.",
    urgency: "Wij vertrouwen erop dat u dit per omgaande in orde maakt.",
  },
  AANMANING: {
    subject: "Aanmaning: openstaande factuur",
    greeting: "Aanmaning",
    message:
      "Ondanks meerdere herinneringen is de betaling van onderstaande factuur nog niet ontvangen. Dit is een formele aanmaning. Indien wij binnen 14 dagen geen betaling ontvangen, zijn wij genoodzaakt verdere stappen te ondernemen.",
    urgency:
      "Eventuele extra kosten die hieruit voortvloeien worden aan u doorberekend.",
  },
}

export function renderPaymentReminderEmail(props: PaymentReminderEmailProps): string {
  const { companyName, customerName, invoiceNumber, total, dueDate, reminderType, paymentUrl } = props
  const config = reminderConfig[reminderType]

  const body = `
    <p>Beste ${customerName},</p>
    <p><strong>${config.greeting}</strong></p>
    <p>${config.message}</p>

    <div class="highlight">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:#64748b;">Factuurnummer</span>
        <strong>${invoiceNumber}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="color:#64748b;">Openstaand bedrag</span>
        <strong class="text-red">${formatCurrency(total)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span style="color:#64748b;">Oorspronkelijke vervaldatum</span>
        <strong>${formatDate(dueDate)}</strong>
      </div>
    </div>

    ${config.urgency ? `<p>${config.urgency}</p>` : ""}

    ${
      paymentUrl
        ? `<p style="text-align:center;" class="mt-4">
        <a href="${paymentUrl}" class="btn">Betaal nu</a>
      </p>`
        : ""
    }

    <p class="mt-4">Heeft u reeds betaald? Dan kunt u deze herinnering als niet verzonden beschouwen.</p>
    <p>Met vriendelijke groet,<br/>${companyName}</p>
  `

  return renderEmailLayout({ companyName, children: body })
}

export function getReminderSubject(reminderType: string, invoiceNumber: string): string {
  const config = reminderConfig[reminderType as keyof typeof reminderConfig]
  return config ? `${config.subject} - ${invoiceNumber}` : `Herinnering - ${invoiceNumber}`
}
