"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"

interface PaymentButtonProps {
  invoiceId: string
  total: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

export function PaymentButton({ invoiceId, total }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handlePayment() {
    setLoading(true)
    try {
      const res = await fetch("/api/public/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      })

      const result = await res.json()

      if (result.success && result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      className="w-full"
      size="lg"
      disabled={loading}
    >
      <CreditCard className="mr-2 h-4 w-4" />
      {loading ? "Bezig met verwerken..." : `Betaal nu ${formatCurrency(total)}`}
    </Button>
  )
}
