import createMollieClient from "@mollie/api-client"

function getMollieClient() {
  if (!process.env.MOLLIE_API_KEY) return null
  return createMollieClient({ apiKey: process.env.MOLLIE_API_KEY })
}

export async function createPayment(options: {
  invoiceId: string
  amount: number
  description: string
  redirectUrl: string
}) {
  const mollie = getMollieClient()
  if (!mollie) return null

  const payment = await mollie.payments.create({
    amount: { currency: "EUR", value: options.amount.toFixed(2) },
    description: options.description,
    redirectUrl: options.redirectUrl,
    webhookUrl: process.env.MOLLIE_WEBHOOK_URL || `${process.env.NEXTAUTH_URL}/api/webhooks/mollie`,
    metadata: { invoiceId: options.invoiceId },
  })

  return payment
}

export async function getPayment(paymentId: string) {
  const mollie = getMollieClient()
  if (!mollie) return null

  return mollie.payments.get(paymentId)
}

export function isMollieConfigured(): boolean {
  return !!process.env.MOLLIE_API_KEY
}
