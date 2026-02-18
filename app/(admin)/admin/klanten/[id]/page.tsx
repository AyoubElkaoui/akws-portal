import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
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
import { PLAN_LABELS, PLAN_PRICES } from "@/types";
import { TenantModules } from "./tenant-modules";
import { TenantActions } from "./tenant-actions";
import { AddProjectDialog } from "./add-project-dialog";
import { ProjectManagement } from "./project-management";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FolderKanban,
  Receipt,
  MessageSquare,
  Globe,
  Wrench,
} from "lucide-react";

const invoiceStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  CONCEPT: { label: "Concept", className: "bg-slate-100 text-slate-700" },
  VERZONDEN: { label: "Verzonden", className: "bg-blue-100 text-blue-700" },
  BETAALD: { label: "Betaald", className: "bg-green-100 text-green-700" },
  VERLOPEN: { label: "Verlopen", className: "bg-red-100 text-red-700" },
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

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true, email: true, createdAt: true } },
      tenantModules: { include: { module: true } },
      projects: {
        orderBy: { createdAt: "desc" },
        include: {
          milestones: { orderBy: { createdAt: "asc" } },
          revisions: { orderBy: { createdAt: "desc" } },
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { invoiceItems: true },
      },
      tickets: {
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: { _count: { select: { messages: true } } },
      },
      websiteStatus: true,
      maintenanceLogs: {
        orderBy: { performedAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          projects: true,
          invoices: true,
          tickets: true,
          contacts: true,
          files: true,
          appointments: true,
          reviews: true,
        },
      },
    },
  });

  if (!tenant) notFound();

  const totalRevenue = tenant.invoices
    .filter((i) => i.status === "BETAALD")
    .reduce((sum, i) => sum + i.total, 0);
  const openInvoices = tenant.invoices.filter(
    (i) => i.status === "VERZONDEN" || i.status === "VERLOPEN",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/klanten">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {tenant.companyName}
          </h2>
          <p className="text-sm text-slate-500">{tenant.slug}</p>
        </div>
        <Badge
          className={
            tenant.active
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }
        >
          {tenant.active ? "Actief" : "Inactief"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Pakket</p>
              <p className="text-sm font-medium">
                {PLAN_LABELS[tenant.plan]} — €{PLAN_PRICES[tenant.plan]}/mnd
              </p>
            </div>
            {tenant.domain && (
              <div>
                <p className="text-xs text-slate-500">Website</p>
                <p className="text-sm font-medium">{tenant.domain}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500">Aangemaakt</p>
              <p className="text-sm font-medium">
                {formatDate(tenant.createdAt)}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {tenant._count.projects}
                </p>
                <p className="text-xs text-slate-500">Projecten</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {tenant._count.invoices}
                </p>
                <p className="text-xs text-slate-500">Facturen</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {tenant._count.tickets}
                </p>
                <p className="text-xs text-slate-500">Tickets</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {tenant._count.contacts}
                </p>
                <p className="text-xs text-slate-500">Contacten</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {tenant._count.files}
                </p>
                <p className="text-xs text-slate-500">Bestanden</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {tenant._count.reviews}
                </p>
                <p className="text-xs text-slate-500">Reviews</p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs text-slate-500">Omzet (betaald)</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Users card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gebruikers</CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.users.length === 0 ? (
              <p className="text-sm text-slate-500">Geen gebruikers</p>
            ) : (
              <div className="space-y-3">
                {tenant.users.map((user) => (
                  <div key={user.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-slate-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions card */}
        <TenantActions tenant={tenant} />
      </div>

      {/* Modules */}
      <TenantModules
        tenantId={tenant.id}
        tenantPlan={tenant.plan}
        modules={tenant.tenantModules.map((tm) => ({
          id: tm.module.id,
          slug: tm.module.slug,
          name: tm.module.name,
          description: tm.module.description,
          enabled: tm.enabled,
        }))}
      />

      {/* Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Projecten
          </CardTitle>
          <AddProjectDialog tenantId={tenant.id} />
        </CardHeader>
        <CardContent>
          {tenant.projects.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Nog geen projecten voor deze klant.
            </p>
          ) : (
            <div className="space-y-3">
              {tenant.projects.map((project) => (
                <ProjectManagement
                  key={project.id}
                  project={{
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    milestones: project.milestones.map((m) => ({
                      id: m.id,
                      title: m.title,
                      completed: m.completed,
                      dueDate: m.dueDate?.toISOString() || null,
                    })),
                    revisions: project.revisions.map((r) => ({
                      id: r.id,
                      description: r.description,
                      status: r.status,
                      createdAt: r.createdAt.toISOString(),
                    })),
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Facturen
            {openInvoices.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {openInvoices.length} openstaand
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tenant.invoices.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Nog geen facturen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vervaldatum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.invoices.map((invoice) => {
                  const status = invoiceStatusConfig[invoice.status];
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {invoice.customerName}
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
          )}
        </CardContent>
      </Card>

      {/* Recent tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Recente tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tenant.tickets.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Nog geen tickets.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Onderwerp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Berichten</TableHead>
                  <TableHead>Bijgewerkt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          ticket.status === "OPEN"
                            ? "bg-blue-100 text-blue-700"
                            : ticket.status === "IN_BEHANDELING"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-700"
                        }
                      >
                        {ticket.status === "OPEN"
                          ? "Open"
                          : ticket.status === "IN_BEHANDELING"
                            ? "In behandeling"
                            : "Gesloten"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {ticket._count.messages}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(ticket.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Website & Maintenance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Website status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.websiteStatus.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Geen website geconfigureerd.
              </p>
            ) : (
              <div className="space-y-3">
                {tenant.websiteStatus.map((ws) => (
                  <div key={ws.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{ws.url}</span>
                      <Badge
                        className={
                          ws.isOnline
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {ws.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                      <div>
                        Uptime:{" "}
                        <span className="font-medium text-slate-700">
                          {ws.uptimePercent.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        Laadtijd:{" "}
                        <span className="font-medium text-slate-700">
                          {ws.loadTime ? `${ws.loadTime.toFixed(1)}s` : "—"}
                        </span>
                      </div>
                      <div>
                        SSL:{" "}
                        <span className="font-medium text-slate-700">
                          {ws.sslExpiry ? formatDate(ws.sslExpiry) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Onderhoud
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.maintenanceLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Geen onderhoud gelogd.
              </p>
            ) : (
              <div className="space-y-2">
                {tenant.maintenanceLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700">{log.description}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          log.type === "UPDATE"
                            ? "bg-blue-50 text-blue-700"
                            : log.type === "BACKUP"
                              ? "bg-green-50 text-green-700"
                              : "bg-orange-50 text-orange-700"
                        }
                      >
                        {log.type === "UPDATE"
                          ? "Update"
                          : log.type === "BACKUP"
                            ? "Backup"
                            : "Beveiliging"}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {formatDate(log.performedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
