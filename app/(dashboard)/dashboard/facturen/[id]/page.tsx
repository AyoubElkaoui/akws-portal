import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled, getTenant } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Send,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { InvoicePreview } from "@/components/shared/invoice-preview";
import { InvoiceDetailActions } from "./invoice-detail-actions";
import { CopyLinkButton } from "./copy-link-button";
import { Link2 } from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; className: string; step: number }
> = {
  CONCEPT: {
    label: "Concept",
    className: "bg-slate-100 text-slate-700",
    step: 1,
  },
  VERZONDEN: {
    label: "Verzonden",
    className: "bg-blue-100 text-blue-700",
    step: 2,
  },
  BETAALD: {
    label: "Betaald",
    className: "bg-green-100 text-green-700",
    step: 3,
  },
  VERLOPEN: {
    label: "Verlopen",
    className: "bg-red-100 text-red-700",
    step: 2,
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default async function FactuurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "facturatie"))) {
    redirect("/dashboard");
  }

  const [invoice, tenant] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: {
        invoiceItems: true,
        paymentReminders: { orderBy: { sentAt: "asc" } },
      },
    }),
    getTenant(user.tenantId),
  ]);

  if (!invoice || invoice.tenantId !== user.tenantId) {
    notFound();
  }

  const status = statusConfig[invoice.status] ?? statusConfig.CONCEPT;
  const isOverdue = invoice.status === "VERLOPEN";

  const steps = [
    { label: "Aangemaakt", date: invoice.createdAt },
    {
      label: "Verzonden",
      date: invoice.status !== "CONCEPT" ? invoice.createdAt : null,
    },
    { label: "Betaald", date: invoice.paidAt },
  ];

  // Build timeline events
  const timeline: { label: string; date: Date; type: string }[] = [
    { label: "Factuur aangemaakt", date: invoice.createdAt, type: "created" },
  ];

  if (invoice.status !== "CONCEPT") {
    timeline.push({
      label: "Factuur verzonden",
      date: invoice.updatedAt,
      type: "sent",
    });
  }

  for (const reminder of invoice.paymentReminders) {
    const reminderLabels: Record<string, string> = {
      HERINNERING_1: "Eerste herinnering verstuurd",
      HERINNERING_2: "Tweede herinnering verstuurd",
      AANMANING: "Aanmaning verstuurd",
    };
    timeline.push({
      label: reminderLabels[reminder.type] || "Herinnering verstuurd",
      date: reminder.sentAt,
      type: "reminder",
    });
  }

  if (invoice.paidAt) {
    timeline.push({
      label: "Betaling ontvangen",
      date: invoice.paidAt,
      type: "paid",
    });
  }

  const items = (invoice.items as any[]) || [];

  return (
    <div className="space-y-6">
      <Link href="/dashboard/facturen">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="size-4" />
          Terug naar facturen
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Factuur {invoice.invoiceNumber}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {invoice.customerName} &middot; {formatCurrency(invoice.total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`${status.className} text-sm px-3 py-1`}
          >
            {status.label}
          </Badge>
          <InvoiceDetailActions invoiceId={invoice.id} status={invoice.status} />
        </div>
      </div>

      {/* Payment link for sent/overdue invoices */}
      {(invoice.status === "VERZONDEN" || invoice.status === "VERLOPEN") && (
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Link2 className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-0.5">Betaallink</p>
              <p className="text-sm text-slate-700 truncate font-mono">
                {process.env.NEXTAUTH_URL || ""}/betaal/{invoice.id}
              </p>
            </div>
            <CopyLinkButton url={`${process.env.NEXTAUTH_URL || ""}/betaal/${invoice.id}`} />
          </CardContent>
        </Card>
      )}

      {/* Overdue warning */}
      {isOverdue && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Deze factuur is verlopen sinds {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice preview - takes 2/3 */}
        <div className="lg:col-span-2">
          <InvoicePreview
            companyName={tenant?.companyName || ""}
            companyDomain={tenant?.domain}
            companyLogo={tenant?.logo}
            companyAddress={tenant?.address}
            companyPostalCode={tenant?.postalCode}
            companyCity={tenant?.city}
            companyPhone={tenant?.phone}
            companyEmail={tenant?.email}
            companyKvk={tenant?.kvkNumber}
            companyBtw={tenant?.btwNumber}
            companyIban={tenant?.iban}
            companyBic={tenant?.bic}
            customerName={invoice.customerName}
            customerEmail={invoice.customerEmail}
            items={items}
            vatRate={invoice.vatRate}
            subtotal={invoice.subtotal}
            vatAmount={invoice.vatAmount}
            total={invoice.total}
            dueDate={invoice.dueDate.toISOString()}
            invoiceNumber={invoice.invoiceNumber}
            createdAt={invoice.createdAt}
            paidAt={invoice.paidAt}
          />
        </div>

        {/* Timeline sidebar - takes 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geschiedenis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />
              <ul className="space-y-4">
                {timeline.map((event, i) => (
                  <li key={i} className="relative flex items-start gap-3">
                    <div className="relative z-10 shrink-0">
                      {event.type === "paid" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 bg-white rounded-full" />
                      ) : event.type === "reminder" ? (
                        <Clock className="h-4 w-4 text-orange-500 bg-white rounded-full" />
                      ) : event.type === "sent" ? (
                        <Send className="h-4 w-4 text-blue-500 bg-white rounded-full" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-400 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{event.label}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
