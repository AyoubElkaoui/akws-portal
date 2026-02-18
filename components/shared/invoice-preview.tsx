"use client"

const vatLabels: Record<string, string> = {
  STANDAARD: "21%",
  LAAG: "9%",
  VRIJGESTELD: "0%",
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

interface InvoicePreviewProps {
  companyName: string
  companyDomain?: string | null
  companyLogo?: string | null
  companyAddress?: string | null
  companyPostalCode?: string | null
  companyCity?: string | null
  companyPhone?: string | null
  companyEmail?: string | null
  companyKvk?: string | null
  companyBtw?: string | null
  companyIban?: string | null
  companyBic?: string | null
  customerName: string
  customerEmail: string
  items: InvoiceItem[]
  vatRate: string
  subtotal: number
  vatAmount: number
  total: number
  dueDate: string
  invoiceNumber?: string
  createdAt?: Date | string
  paidAt?: Date | string | null
}

export function InvoicePreview({
  companyName,
  companyDomain,
  companyLogo,
  companyAddress,
  companyPostalCode,
  companyCity,
  companyPhone,
  companyEmail,
  companyKvk,
  companyBtw,
  companyIban,
  companyBic,
  customerName,
  customerEmail,
  items,
  vatRate,
  subtotal,
  vatAmount,
  total,
  dueDate,
  invoiceNumber,
  createdAt,
  paidAt,
}: InvoicePreviewProps) {
  const displayDate = createdAt || new Date().toISOString()
  const displayNumber = invoiceNumber || "CONCEPT"
  const hasAddress = companyAddress || companyCity

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 text-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900">FACTUUR</h2>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">
            {displayNumber}
          </p>
        </div>
        <div className="text-right flex items-start gap-3 justify-end">
          <div>
            <p className="text-sm font-bold text-slate-900">{companyName || "Bedrijfsnaam"}</p>
            {hasAddress && (
              <p className="text-xs text-slate-500">
                {companyAddress}
                {companyAddress && (companyPostalCode || companyCity) ? ", " : ""}
                {companyPostalCode} {companyCity}
              </p>
            )}
            {companyDomain && (
              <p className="text-xs text-slate-500">{companyDomain}</p>
            )}
          </div>
          {companyLogo && (
            <img
              src={companyLogo}
              alt={companyName}
              className="h-12 w-12 rounded object-contain"
            />
          )}
        </div>
      </div>

      {/* Customer + dates */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
            Factuur aan
          </p>
          <p className="font-semibold text-slate-900">
            {customerName || "Klantnaam"}
          </p>
          <p className="text-xs text-slate-600">
            {customerEmail || "klant@voorbeeld.nl"}
          </p>
        </div>
        <div className="text-right">
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-end gap-3">
              <span className="text-slate-500">Datum:</span>
              <span className="font-medium">{formatDate(displayDate)}</span>
            </div>
            {dueDate && (
              <div className="flex justify-end gap-3">
                <span className="text-slate-500">Vervaldatum:</span>
                <span className="font-medium">{formatDate(dueDate)}</span>
              </div>
            )}
            {paidAt && (
              <div className="flex justify-end gap-3">
                <span className="text-slate-500">Betaald:</span>
                <span className="font-medium text-green-600">{formatDate(paidAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              Omschrijving
            </th>
            <th className="text-right py-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              Aantal
            </th>
            <th className="text-right py-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              Prijs
            </th>
            <th className="text-right py-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              Totaal
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-xs text-slate-400">
                Voeg factuurregels toe
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr
                key={index}
                className={index < items.length - 1 ? "border-b border-slate-100" : ""}
              >
                <td className="py-2 text-xs text-slate-900">
                  {item.description || "\u2014"}
                </td>
                <td className="py-2 text-xs text-slate-600 text-right">
                  {item.quantity}
                </td>
                <td className="py-2 text-xs text-slate-600 text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-2 text-xs font-medium text-slate-900 text-right">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Subtotaal</span>
            <span className="text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">
              BTW ({vatLabels[vatRate] || "0%"})
            </span>
            <span className="text-slate-900">{formatCurrency(vatAmount)}</span>
          </div>
          <div className="border-t-2 border-slate-900 pt-1 flex justify-between">
            <span className="font-bold text-slate-900">Totaal</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      {companyIban && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">
            Betalingsgegevens
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-slate-500">IBAN:</span>
            <span className="font-medium text-slate-900">{companyIban}</span>
            {companyBic && (
              <>
                <span className="text-slate-500">BIC:</span>
                <span className="font-medium text-slate-900">{companyBic}</span>
              </>
            )}
            <span className="text-slate-500">T.n.v.:</span>
            <span className="font-medium text-slate-900">{companyName}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
          <span>{companyName || "Bedrijfsnaam"}</span>
          {companyKvk && <span>KvK: {companyKvk}</span>}
          {companyBtw && <span>BTW: {companyBtw}</span>}
          {companyPhone && <span>Tel: {companyPhone}</span>}
          {companyEmail && <span>{companyEmail}</span>}
        </div>
      </div>
    </div>
  )
}
