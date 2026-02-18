import { redirect } from "next/navigation";
import Link from "next/link";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { tenantScope } from "@/lib/db/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Euro,
  Clock,
  CheckCircle,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { InvoiceActions } from "./invoice-actions";

const statusConfig: Record<string, { label: string; className: string }> = {
  CONCEPT: {
    label: "Concept",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  VERZONDEN: {
    label: "Verzonden",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  BETAALD: {
    label: "Betaald",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  VERLOPEN: {
    label: "Verlopen",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
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
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function FacturenPage() {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "facturatie"))) {
    redirect("/dashboard");
  }

  const allInvoices = await db.invoice.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { createdAt: "desc" },
    include: {
      invoiceItems: true,
      _count: { select: { paymentReminders: true } },
    },
  });

  const invoices = allInvoices.filter((inv) => inv.type !== "PLATFORM_FACTUUR");
  const platformInvoices = allInvoices.filter(
    (inv) => inv.type === "PLATFORM_FACTUUR",
  );

  const totalPaid = invoices
    .filter((inv) => inv.status === "BETAALD")
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalOpen = invoices
    .filter((inv) => inv.status === "VERZONDEN" || inv.status === "VERLOPEN")
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalOverdue = invoices.filter(
    (inv) => inv.status === "VERLOPEN",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Facturen</h2>
          <p className="text-sm text-slate-500">Maak en beheer je facturen.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/facturen/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe factuur
          </Link>
        </Button>
      </div>

      {/* Overdue warning */}
      {totalOverdue > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Je hebt {totalOverdue} verlopen factuur
              {totalOverdue > 1 ? "en" : ""} met een totaal van{" "}
              {formatCurrency(
                invoices
                  .filter((inv) => inv.status === "VERLOPEN")
                  .reduce((sum, inv) => sum + inv.total, 0),
              )}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Neem contact op met je klanten om betaling te regelen.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Betaald</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Euro className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Openstaand</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totalOpen)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Verlopen</p>
              <p className="text-xl font-bold text-slate-900">{totalOverdue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice table */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 text-center">
              Je hebt nog geen facturen. Maak je eerste factuur aan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factuurnummer</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vervaldatum</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const status = statusConfig[invoice.status];

                  return (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <TableCell className="font-medium text-slate-900">
                        <Link
                          href={`/dashboard/facturen/${invoice.id}`}
                          className="hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-slate-900">
                            {invoice.customerName}
                          </span>
                          <br />
                          <span className="text-xs text-slate-500">
                            {invoice.customerEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell>
                        <InvoiceActions
                          invoiceId={invoice.id}
                          status={invoice.status}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Platform invoices from AK Web Solutions */}
      {platformInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Facturen van AK Web Solutions
            </CardTitle>
            <p className="text-sm text-slate-500">
              Facturen voor hosting, onderhoud en andere diensten.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factuurnummer</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vervaldatum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status];

                  return (
                    <TableRow key={invoice.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">
                        <Link
                          href={`/dashboard/facturen/${invoice.id}`}
                          className="hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
