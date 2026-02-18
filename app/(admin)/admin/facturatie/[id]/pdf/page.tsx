import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { PrintButton } from "./print-button";

const vatLabels: Record<string, string> = {
  STANDAARD: "21%",
  LAAG: "9%",
  VRIJGESTELD: "0%",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function AdminInvoicePdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      invoiceItems: true,
      tenant: { select: { companyName: true, domain: true, logo: true } },
    },
  });

  if (!invoice) notFound();

  return (
    <>
      {/* Print controls - hidden on print */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <PrintButton />
        <Link
          href={`/admin/facturatie/${id}`}
          className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Terug
        </Link>
      </div>

      {/* Invoice PDF layout */}
      <div className="mx-auto max-w-[800px] bg-white p-8 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">FACTUUR</h1>
            <p className="text-lg font-semibold text-slate-700 mt-1">
              {invoice.invoiceNumber}
            </p>
          </div>
          <div className="text-right flex items-start gap-3 justify-end">
            <div>
              <p className="text-lg font-bold text-slate-900">
                {invoice.tenant.companyName}
              </p>
              {invoice.tenant.domain && (
                <p className="text-sm text-slate-500">
                  {invoice.tenant.domain}
                </p>
              )}
            </div>
            {invoice.tenant.logo && (
              <img
                src={invoice.tenant.logo}
                alt={invoice.tenant.companyName}
                className="h-12 w-12 rounded object-contain"
              />
            )}
          </div>
        </div>

        {/* Customer + dates */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Factuur aan
            </p>
            <p className="font-semibold text-slate-900">
              {invoice.customerName}
            </p>
            <p className="text-sm text-slate-600">{invoice.customerEmail}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1 text-sm">
              <div className="flex justify-end gap-4">
                <span className="text-slate-500">Factuurdatum:</span>
                <span className="font-medium">
                  {formatDate(invoice.createdAt)}
                </span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-slate-500">Vervaldatum:</span>
                <span className="font-medium">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-end gap-4">
                  <span className="text-slate-500">Betaald op:</span>
                  <span className="font-medium text-green-600">
                    {formatDate(invoice.paidAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line items table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Omschrijving
              </th>
              <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Aantal
              </th>
              <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Prijs
              </th>
              <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Totaal
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoiceItems.map((item, index) => (
              <tr
                key={item.id}
                className={
                  index < invoice.invoiceItems.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }
              >
                <td className="py-3 text-sm text-slate-900">
                  {item.description}
                </td>
                <td className="py-3 text-sm text-slate-600 text-right">
                  {item.quantity}
                </td>
                <td className="py-3 text-sm text-slate-600 text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-3 text-sm font-medium text-slate-900 text-right">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotaal</span>
              <span className="text-slate-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                BTW ({vatLabels[invoice.vatRate]})
              </span>
              <span className="text-slate-900">
                {formatCurrency(invoice.vatAmount)}
              </span>
            </div>
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between">
              <span className="text-lg font-bold text-slate-900">Totaal</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            {invoice.tenant.companyName} &mdash; {invoice.invoiceNumber}
          </p>
        </div>
      </div>
    </>
  );
}
