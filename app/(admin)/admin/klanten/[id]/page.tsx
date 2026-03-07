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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLAN_LABELS, PLAN_PRICES } from "@/types";
import { TenantModules } from "./tenant-modules";
import { TenantActions } from "./tenant-actions";
import { AddProjectDialog } from "./add-project-dialog";
import { ProjectManagement } from "./project-management";
import { TenantEmailAccounts } from "./tenant-email-accounts";
import { TrackingCode } from "@/app/(dashboard)/dashboard/statistieken/tracking-code";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FolderKanban,
  Receipt,
  MessageSquare,
  Globe,
  Wrench,
  Users,
  Settings,
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
    .filter((i: any) => i.status === "BETAALD")
    .reduce((sum: number, i: any) => sum + i.total, 0);
  const openInvoices = tenant.invoices.filter(
    (i: any) => i.status === "VERZONDEN" || i.status === "VERLOPEN",
  );
  const openTickets = tenant.tickets.filter(
    (t: any) => t.status !== "GESLOTEN",
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.akwebsolutions.nl";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/klanten">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">
                {tenant.companyName}
              </h2>
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
            <p className="text-sm text-slate-500">
              {PLAN_LABELS[tenant.plan]} — €{PLAN_PRICES[tenant.plan]}/mnd
              {tenant.domain && (
                <span className="ml-3 text-slate-400">{tenant.domain}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{tenant._count.projects}</p>
          <p className="text-xs text-slate-500">Projecten</p>
        </div>
        <div className="rounded-lg border bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{tenant._count.invoices}</p>
          <p className="text-xs text-slate-500">Facturen</p>
        </div>
        <div className="rounded-lg border bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{tenant._count.tickets}</p>
          <p className="text-xs text-slate-500">Tickets</p>
        </div>
        <div className="rounded-lg border bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{tenant._count.contacts}</p>
          <p className="text-xs text-slate-500">Contacten</p>
        </div>
        <div className="rounded-lg border bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{tenant._count.files}</p>
          <p className="text-xs text-slate-500">Bestanden</p>
        </div>
        <div className="rounded-lg border bg-white p-3 text-center">
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-slate-500">Omzet</p>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="overzicht">
        <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto rounded-none">
          <TabsTrigger value="overzicht" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2">
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="projecten" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2">
            <FolderKanban className="h-3.5 w-3.5 mr-1.5" />
            Projecten
            {tenant._count.projects > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">{tenant._count.projects}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="facturen" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2">
            <Receipt className="h-3.5 w-3.5 mr-1.5" />
            Facturen
            {openInvoices.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-xs">{openInvoices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tickets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Tickets
            {openTickets.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs bg-orange-100 text-orange-700">{openTickets.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="website" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2">
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Website
          </TabsTrigger>
          <TabsTrigger value="instellingen" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Instellingen
          </TabsTrigger>
        </TabsList>

        {/* === OVERZICHT === */}
        <TabsContent value="overzicht" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Gebruikers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenant.users.length === 0 ? (
                  <p className="text-sm text-slate-500">Geen gebruikers</p>
                ) : (
                  <div className="space-y-2">
                    {tenant.users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(user.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Klantgegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Bedrijfsnaam</p>
                    <p className="text-sm font-medium">{tenant.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Slug</p>
                    <p className="text-sm font-medium font-mono">{tenant.slug}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pakket</p>
                    <p className="text-sm font-medium">{PLAN_LABELS[tenant.plan]} — €{PLAN_PRICES[tenant.plan]}/mnd</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Aangemaakt</p>
                    <p className="text-sm font-medium">{formatDate(tenant.createdAt)}</p>
                  </div>
                  {tenant.domain && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Website</p>
                      <p className="text-sm font-medium">{tenant.domain}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Recente tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {tenant.tickets.length === 0 ? (
                  <p className="text-sm text-slate-400">Geen tickets</p>
                ) : (
                  <div className="space-y-2">
                    {tenant.tickets.slice(0, 5).map((ticket: any) => (
                      <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="flex items-center justify-between text-sm hover:bg-slate-50 rounded px-2 py-1.5 -mx-2">
                        <span className="truncate text-slate-700">{ticket.subject}</span>
                        <Badge variant="secondary" className={`shrink-0 ml-2 text-xs ${ticket.status === "OPEN" ? "bg-blue-100 text-blue-700" : ticket.status === "IN_BEHANDELING" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                          {ticket.status === "OPEN" ? "Open" : ticket.status === "IN_BEHANDELING" ? "In behandeling" : "Gesloten"}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Website status</CardTitle>
              </CardHeader>
              <CardContent>
                {tenant.websiteStatus.length === 0 ? (
                  <p className="text-sm text-slate-400">Niet geconfigureerd</p>
                ) : (
                  <div className="space-y-3">
                    {tenant.websiteStatus.map((ws: any) => (
                      <div key={ws.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 truncate">{ws.url}</span>
                          <Badge className={`shrink-0 ${ws.isOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {ws.isOnline ? "Online" : "Offline"}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>Uptime: <strong className="text-slate-700">{ws.uptimePercent.toFixed(1)}%</strong></span>
                          <span>Laadtijd: <strong className="text-slate-700">{ws.loadTime ? `${ws.loadTime.toFixed(1)}s` : "—"}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Laatste onderhoud</CardTitle>
              </CardHeader>
              <CardContent>
                {tenant.maintenanceLogs.length === 0 ? (
                  <p className="text-sm text-slate-400">Geen onderhoud</p>
                ) : (
                  <div className="space-y-2">
                    {tenant.maintenanceLogs.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-slate-700">{log.description}</span>
                        <Badge variant="secondary" className={`shrink-0 ml-2 text-xs ${log.type === "UPDATE" ? "bg-blue-50 text-blue-700" : log.type === "BACKUP" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                          {log.type === "UPDATE" ? "Update" : log.type === "BACKUP" ? "Backup" : "Beveiliging"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === PROJECTEN === */}
        <TabsContent value="projecten" className="mt-6">
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
                <p className="text-sm text-slate-500 py-4 text-center">Nog geen projecten voor deze klant.</p>
              ) : (
                <div className="space-y-3">
                  {tenant.projects.map((project: any) => (
                    <ProjectManagement
                      key={project.id}
                      project={{
                        id: project.id,
                        name: project.name,
                        status: project.status,
                        milestones: project.milestones.map((m: any) => ({
                          id: m.id,
                          title: m.title,
                          completed: m.completed,
                          dueDate: m.dueDate?.toISOString() || null,
                        })),
                        revisions: project.revisions.map((r: any) => ({
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
        </TabsContent>

        {/* === FACTUREN === */}
        <TabsContent value="facturen" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Facturen
                {openInvoices.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{openInvoices.length} openstaand</Badge>
                )}
              </CardTitle>
              <Button asChild size="sm">
                <Link href="/admin/facturatie/nieuw">Nieuwe factuur</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {tenant.invoices.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">Nog geen facturen.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nummer</TableHead>
                      <TableHead>Bedrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vervaldatum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenant.invoices.map((invoice: any) => {
                      const status = invoiceStatusConfig[invoice.status];
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <Link href={`/admin/facturatie/${invoice.id}`} className="font-medium text-blue-600 hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={status.className}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">{formatDate(invoice.dueDate)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TICKETS === */}
        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Tickets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tenant.tickets.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">Nog geen tickets.</p>
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
                    {tenant.tickets.map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <Link href={`/admin/tickets/${ticket.id}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                            {ticket.subject}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={ticket.status === "OPEN" ? "bg-blue-100 text-blue-700" : ticket.status === "IN_BEHANDELING" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"}>
                            {ticket.status === "OPEN" ? "Open" : ticket.status === "IN_BEHANDELING" ? "In behandeling" : "Gesloten"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">{ticket._count.messages}</TableCell>
                        <TableCell className="text-slate-500">{formatDate(ticket.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === WEBSITE === */}
        <TabsContent value="website" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.websiteStatus.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Geen website geconfigureerd. Stel een domein in bij Instellingen.</p>
              ) : (
                <div className="space-y-4">
                  {tenant.websiteStatus.map((ws: any) => (
                    <div key={ws.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{ws.url}</span>
                        <Badge className={ws.isOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                          {ws.isOnline ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                          <p className="text-lg font-bold text-slate-900">{ws.uptimePercent.toFixed(1)}%</p>
                          <p className="text-xs text-slate-500">Uptime</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                          <p className="text-lg font-bold text-slate-900">{ws.loadTime ? `${ws.loadTime.toFixed(1)}s` : "—"}</p>
                          <p className="text-xs text-slate-500">Laadtijd</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                          <p className="text-lg font-bold text-slate-900">{ws.sslExpiry ? formatDate(ws.sslExpiry) : "—"}</p>
                          <p className="text-xs text-slate-500">SSL verloopt</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {tenant.domain && (
            <TrackingCode tenantId={tenant.id} baseUrl={baseUrl} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Onderhoud log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.maintenanceLogs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Geen onderhoud gelogd.</p>
              ) : (
                <div className="space-y-2">
                  {tenant.maintenanceLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between text-sm rounded-lg border px-3 py-2">
                      <span className="text-slate-700">{log.description}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={log.type === "UPDATE" ? "bg-blue-50 text-blue-700" : log.type === "BACKUP" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}>
                          {log.type === "UPDATE" ? "Update" : log.type === "BACKUP" ? "Backup" : "Beveiliging"}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatDate(log.performedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === INSTELLINGEN === */}
        <TabsContent value="instellingen" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <TenantActions tenant={tenant} />
            <TenantEmailAccounts tenantId={tenant.id} />
          </div>

          <TenantModules
            tenantId={tenant.id}
            tenantPlan={tenant.plan}
            modules={tenant.tenantModules.map((tm: any) => ({
              id: tm.module.id,
              slug: tm.module.slug,
              name: tm.module.name,
              description: tm.module.description,
              enabled: tm.enabled,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
