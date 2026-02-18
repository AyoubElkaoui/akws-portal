import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { PaymentButton } from "./payment-button"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date))
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { id } = await params
  const { status: queryStatus } = await searchParams

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      tenant: { select: { companyName: true, primaryColor: true } },
      invoiceItems: true,
    },
  })

  if (!invoice) notFound()

  const isPaid = invoice.status === "BETAALD"
  const justPaid = queryStatus === "success" && !isPaid

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold" style={{ color: invoice.tenant.primaryColor }}>
          {invoice.tenant.companyName}
        </CardTitle>
        <p className="text-sm text-slate-500">
          Factuur {invoice.invoiceNumber}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPaid ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">
              Deze factuur is betaald
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Betaald op {formatDate(invoice.paidAt!)}
            </p>
          </div>
        ) : justPaid ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">
              Bedankt voor uw betaling!
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Uw betaling wordt verwerkt. U ontvangt een bevestiging per e-mail.
            </p>
          </div>
        ) : (
          <>
            {/* Invoice details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Klant</span>
                <span className="font-medium">{invoice.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Vervaldatum</span>
                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <Badge
                  variant="secondary"
                  className={
                    invoice.status === "VERLOPEN"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }
                >
                  {invoice.status === "VERLOPEN" ? "Verlopen" : "Openstaand"}
                </Badge>
              </div>
            </div>

            {/* Items */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Omschrijving</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">Bedrag</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoiceItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-slate-700">
                        {item.description}
                        {item.quantity !== 1 && (
                          <span className="text-slate-400 ml-1">x{item.quantity}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotaal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>BTW</span>
                <span>{formatCurrency(invoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t">
                <span>Totaal</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            <PaymentButton invoiceId={invoice.id} total={invoice.total} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
