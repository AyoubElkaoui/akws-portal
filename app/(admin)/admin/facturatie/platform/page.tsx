import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Receipt, Euro, CheckCircle, Clock } from "lucide-react"
import { AdminInvoiceActions } from "../admin-invoice-actions"

const statusColors: Record<string, string> = {
  CONCEPT: "bg-slate-100 text-slate-600",
  VERZONDEN: "bg-blue-50 text-blue-700",
  BETAALD: "bg-green-50 text-green-700",
  VERLOPEN: "bg-red-50 text-red-700",
}

const statusLabels: Record<string, string> = {
  CONCEPT: "Concept",
  VERZONDEN: "Verzonden",
  BETAALD: "Betaald",
  VERLOPEN: "Verlopen",
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export default async function PlatformFacturenPage() {
  await requireAdmin()

  const invoices = await db.invoice.findMany({
    where: { type: "PLATFORM_FACTUUR" },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { companyName: true } },
      invoiceItems: true,
      _count: { select: { paymentReminders: true } },
    },
  })

  const totalPaid = invoices
    .filter((i) => i.status === "BETAALD")
    .reduce((sum, i) => sum + i.total, 0)
  const totalOpen = invoices
    .filter((i) => i.status === "VERZONDEN" || i.status === "VERLOPEN")
    .reduce((sum, i) => sum + i.total, 0)
  const totalOverdue = invoices.filter((i) => i.status === "VERLOPEN").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platformfacturen</h2>
          <p className="text-sm text-slate-500">
            Facturen van AK Web Solutions aan klanten voor hosting, onderhoud en andere diensten.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/facturatie/platform/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe platformfactuur
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ontvangen</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
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
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalOpen)}</p>
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

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 text-center">
              Nog geen platformfacturen. Maak een factuur aan voor een klant.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Vervaldatum</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium font-mono text-sm">
                      <Link
                        href={`/admin/facturatie/${inv.id}`}
                        className="hover:underline text-blue-600"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-900">{inv.tenant.companyName}</span>
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
                      <AdminInvoiceActions invoiceId={inv.id} status={inv.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
