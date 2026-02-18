import { renderEmailLayout } from "./layout"

interface ReviewRequestEmailProps {
  companyName: string
  customerEmail: string
  reviewUrl: string
}

export function renderReviewRequestEmail({ companyName, reviewUrl }: ReviewRequestEmailProps): string {
  const body = `
    <p>Beste klant,</p>
    <p>Bedankt dat u gebruik maakt van de diensten van <strong>${companyName}</strong>. Wij horen graag hoe u onze service heeft ervaren!</p>
    <p>Het kost slechts een minuut om een review achter te laten. Uw feedback helpt ons om onze dienstverlening te verbeteren.</p>

    <p style="text-align:center;" class="mt-4">
      <a href="${reviewUrl}" class="btn">Schrijf een review</a>
    </p>

    <p class="mt-4">Alvast hartelijk bedankt!</p>
    <p>Met vriendelijke groet,<br/>${companyName}</p>
  `

  return renderEmailLayout({ companyName, children: body })
}
