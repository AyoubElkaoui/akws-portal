import { renderEmailLayout } from "./layout"

interface CampaignEmailProps {
  companyName: string
  body: string
}

export function renderCampaignEmail({ companyName, body }: CampaignEmailProps): string {
  return renderEmailLayout({ companyName, children: body })
}
