import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLAN_PRICES } from "@/types";
import type { Plan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { AdminInvoiceActions } from "./admin-invoice-actions";
import { differenceInDays } from "date-fns";

const statusColors: Record<string, string> = {
  CONCEPT: "bg-slate-100 text-slate-600",
  VERZONDEN: "bg-blue-50 text-blue-700",
  BETAALD: "bg-green-50 text-green-700",
  VERLOPEN: "bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  CONCEPT: "Concept",
  VERZONDEN: "Verzonden",
  BETAALD: "Betaald",
  VERLOPEN: "Verlopen",
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

export default async function AdminFacturatiePage() {
  await requireAdmin();

  const [invoices, tenantsByPlan, totalPaid] = await Promise.all([
    db.invoice.findMany({
      where: { type: "KLANT_FACTUUR" },
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { companyName: true } },
        invoiceItems: true,
        _count: { select: { paymentReminders: true } },
      },
    }),
    db.tenant.groupBy({
      by: ["plan"],
      where: { active: true },
      _count: { plan: true },
    }),
    db.invoice.aggregate({
      where: { status: "BETAALD", type: "KLANT_FACTUUR" },
      _sum: { total: true },
    }),
  ]);

  const mrr = tenantsByPlan.reduce((total, group) => {
    return total + group._count.plan * PLAN_PRICES[group.plan as Plan];
  }, 0);

  const openAmount = invoices
    .filter((i) => i.status === "VERZONDEN" || i.status === "VERLOPEN")
    .reduce((sum, i) => sum + i.total, 0);

  const overdueCount = invoices.filter((i) => i.status === "VERLOPEN").length;
  const conceptCount = invoices.filter((i) => i.status === "CONCEPT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Facturatie</h2>
          <p className="text-sm text-slate-500">
            Beheer alle facturen en abonnementen.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/facturatie/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe factuur
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(mrr)}
            </p>
            <p className="text-xs text-slate-500">uit abonnementen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Totaal ontvangen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalPaid._sum.total ?? 0)}
            </p>
            <p className="text-xs text-slate-500">betaalde facturen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Openstaand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(openAmount)}
            </p>
            <p className="text-xs text-slate-500">nog te ontvangen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Aandacht nodig
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {overdueCount + conceptCount}
            </p>
            <p className="text-xs text-slate-500">
              {overdueCount} verlopen, {conceptCount} concept
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging report for overdue invoices */}
      {overdueCount > 0 &&
        (() => {
          const now = new Date();
          const overdueInvoices = invoices.filter(
            (i) => i.status === "VERLOPEN",
          );
          const aging = {
            "0-30": overdueInvoices.filter(
              (i) => differenceInDays(now, i.dueDate) <= 30,
            ),
            "31-60": overdueInvoices.filter((i) => {
              const d = differenceInDays(now, i.dueDate);
              return d > 30 && d <= 60;
            }),
            "61-90": overdueInvoices.filter((i) => {
              const d = differenceInDays(now, i.dueDate);
              return d > 60 && d <= 90;
            }),
            "90+": overdueInvoices.filter(
              (i) => differenceInDays(now, i.dueDate) > 90,
            ),
          };

          return (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  Ouderdomsrapport verlopen facturen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    {
                      label: "0-30 dagen",
                      items: aging["0-30"],
                      color: "text-orange-600",
                    },
                    {
                      label: "31-60 dagen",
                      items: aging["31-60"],
                      color: "text-orange-700",
                    },
                    {
                      label: "61-90 dagen",
                      items: aging["61-90"],
                      color: "text-red-600",
                    },
                    {
                      label: "90+ dagen",
                      items: aging["90+"],
                      color: "text-red-700",
                    },
                  ].map((group) => (
                    <div key={group.label} className="text-center">
                      <p className={`text-2xl font-bold ${group.color}`}>
                        {formatCurrency(
                          group.items.reduce((sum, i) => sum + i.total, 0),
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{group.label}</p>
                      <p className="text-xs text-slate-400">
                        {group.items.length} factuur
                        {group.items.length !== 1 ? "en" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle facturen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-slate-500">Nog geen facturen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Klant (tenant)</TableHead>
                  <TableHead>Klant (factuur)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Vervaldatum</TableHead>
                  <TableHead>Herinneringen</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      <Link
                        href={`/admin/facturatie/${inv.id}`}
                        className="hover:underline text-blue-600"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {inv.tenant.companyName}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-slate-900">
                          {inv.customerName}
                        </span>
                        <br />
                        <span className="text-xs text-slate-500">
                          {inv.customerEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[inv.status]}>
                        {statusLabels[inv.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inv.total)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(inv.dueDate)}
                    </TableCell>
                    <TableCell>
                      {inv._count.paymentReminders > 0 && (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-200"
                        >
                          {inv._count.paymentReminders}x
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <AdminInvoiceActions
                        invoiceId={inv.id}
                        status={inv.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
