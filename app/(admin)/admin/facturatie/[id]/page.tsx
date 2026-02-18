import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  Mail,
  Bell,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { AdminInvoiceDetailActions } from "./admin-invoice-detail-actions";

const statusConfig: Record<string, { label: string; className: string }> = {
  CONCEPT: { label: "Concept", className: "bg-slate-100 text-slate-700" },
  VERZONDEN: { label: "Verzonden", className: "bg-blue-100 text-blue-700" },
  BETAALD: { label: "Betaald", className: "bg-green-100 text-green-700" },
  VERLOPEN: { label: "Verlopen", className: "bg-red-100 text-red-700" },
};

const vatLabels: Record<string, string> = {
  STANDAARD: "21%",
  LAAG: "9%",
  VRIJGESTELD: "0%",
};

const reminderLabels: Record<string, string> = {
  HERINNERING_1: "1e Herinnering",
  HERINNERING_2: "2e Herinnering",
  AANMANING: "Aanmaning",
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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, companyName: true } },
      invoiceItems: true,
      paymentReminders: { orderBy: { sentAt: "desc" } },
    },
  });

  if (!invoice) notFound();

  const status = statusConfig[invoice.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/facturatie">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">
                {invoice.invoiceNumber}
              </h2>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              Aangemaakt op {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "CONCEPT" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/facturatie/${invoice.id}/bewerken`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Bewerken
              </Link>
            </Button>
          )}
          <AdminInvoiceDetailActions
            invoiceId={invoice.id}
            status={invoice.status}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Klantgegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{invoice.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">{invoice.customerEmail}</span>
              </div>
            </CardContent>
          </Card>

          {/* Invoice items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Factuurregels</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead className="text-right">Aantal</TableHead>
                    <TableHead className="text-right">Prijs</TableHead>
                    <TableHead className="text-right">Totaal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoiceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotaal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    BTW ({vatLabels[invoice.vatRate]})
                  </span>
                  <span>{formatCurrency(invoice.vatAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Totaal</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/klanten/${invoice.tenant.id}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <Building2 className="h-4 w-4" />
                {invoice.tenant.companyName}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Vervaldatum</span>
                <span className="text-sm font-medium">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              {invoice.paidAt && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Betaald op</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatDate(invoice.paidAt)}
                    </span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">BTW-tarief</span>
                <span className="text-sm font-medium">
                  {vatLabels[invoice.vatRate]}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment reminders */}
          {invoice.paymentReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Herinneringen ({invoice.paymentReminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.paymentReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <Badge
                      variant="outline"
                      className="text-orange-600 border-orange-200"
                    >
                      {reminderLabels[reminder.type]}
                    </Badge>
                    <span className="text-slate-500">
                      {formatDateTime(reminder.sentAt)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
