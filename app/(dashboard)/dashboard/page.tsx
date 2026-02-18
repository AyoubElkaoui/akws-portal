import { requireTenant } from "@/lib/api/auth";
import { getTenantModules, getTenant, tenantScope } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Receipt,
  Globe,
  Ticket,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Activity,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  FileCheck,
  Send,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const activityIcons: Record<string, typeof Activity> = {
  TICKET_CREATED: Ticket,
  TICKET_REPLY: MessageSquare,
  TICKET_STATUS_CHANGED: Ticket,
  MILESTONE_COMPLETED: FileCheck,
  INVOICE_SENT: Send,
  INVOICE_PAID: Receipt,
  WEBSITE_DOWN: AlertTriangle,
  WEBSITE_UP: Globe,
};

const activityColors: Record<string, string> = {
  TICKET_CREATED: "text-blue-500",
  TICKET_REPLY: "text-blue-500",
  TICKET_STATUS_CHANGED: "text-orange-500",
  MILESTONE_COMPLETED: "text-green-500",
  INVOICE_SENT: "text-indigo-500",
  INVOICE_PAID: "text-green-500",
  WEBSITE_DOWN: "text-red-500",
  WEBSITE_UP: "text-green-500",
};

export default async function DashboardPage() {
  const user = await requireTenant();
  const scope = tenantScope(user.tenantId);
  const [tenant, enabledModules] = await Promise.all([
    getTenant(user.tenantId),
    getTenantModules(user.tenantId),
  ]);

  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    projectCount,
    activeProjects,
    openTickets,
    websiteStatus,
    openInvoices,
    overdueInvoices,
    recentActivity,
    upcomingMilestones,
    upcomingInvoices,
    ticketsLastWeek,
    projectsLastWeek,
  ] = await Promise.all([
    db.project.count({ where: scope }),
    db.project.count({ where: { ...scope, status: "ACTIEF" } }),
    db.ticket.count({
      where: { ...scope, status: { in: ["OPEN", "IN_BEHANDELING"] } },
    }),
    db.websiteStatus.findFirst({
      where: scope,
      orderBy: { lastCheck: "desc" },
    }),
    enabledModules.includes("facturatie")
      ? db.invoice.count({
          where: { ...scope, status: { in: ["VERZONDEN", "VERLOPEN"] } },
        })
      : null,
    enabledModules.includes("facturatie")
      ? db.invoice.count({
          where: { ...scope, status: "VERLOPEN" },
        })
      : 0,
    db.activityEvent.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.milestone.findMany({
      where: {
        project: scope,
        completed: false,
        dueDate: { gte: now, lte: twoWeeksFromNow },
      },
      include: { project: { select: { name: true, id: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    enabledModules.includes("facturatie")
      ? db.invoice.findMany({
          where: {
            ...scope,
            status: { in: ["VERZONDEN", "VERLOPEN"] },
            dueDate: { lte: twoWeeksFromNow },
          },
          orderBy: { dueDate: "asc" },
          take: 5,
        })
      : [],
    db.ticket.count({
      where: { ...scope, createdAt: { gte: oneWeekAgo } },
    }),
    db.project.count({
      where: { ...scope, status: "ACTIEF", createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  const hasData =
    projectCount > 0 ||
    openTickets > 0 ||
    (openInvoices !== null && openInvoices > 0);

  const deadlines = [
    ...upcomingMilestones.map((m) => ({
      type: "milestone" as const,
      label: m.title,
      sublabel: m.project.name,
      date: m.dueDate!,
      link: `/dashboard/projecten/${m.project.id}`,
    })),
    ...upcomingInvoices.map((inv) => ({
      type: "invoice" as const,
      label: `Factuur ${inv.invoiceNumber}`,
      sublabel: `€${inv.total.toFixed(2)}`,
      date: inv.dueDate,
      link: `/dashboard/facturen`,
      overdue: inv.status === "VERLOPEN",
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Welkom terug, {user.name.split(" ")[0]}
        </h2>
        <p className="text-sm text-slate-500">
          Overzicht van {tenant?.companyName}
        </p>
      </div>

      {/* Alert banners */}
      {(overdueInvoices as number) > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Je hebt {overdueInvoices} verlopen factuur
              {(overdueInvoices as number) > 1 ? "en" : ""}
            </p>
          </div>
          <Link href="/dashboard/facturen">
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              Bekijken
            </Button>
          </Link>
        </div>
      )}

      {websiteStatus && !websiteStatus.isOnline && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Je website is momenteel offline
            </p>
          </div>
          <Link href="/dashboard/website">
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              Details
            </Button>
          </Link>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {websiteStatus && (
          <Link href="/dashboard/website" className="group">
            <Card className="transition-shadow group-hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Website
                </CardTitle>
                <Globe className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {websiteStatus.isOnline ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        Online
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        Offline
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Uptime: {websiteStatus.uptimePercent.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/projecten" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Actieve projecten
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {activeProjects}
                </p>
                {projectsLastWeek > 0 && (
                  <span className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-0.5" />+{projectsLastWeek}{" "}
                    deze week
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{projectCount} totaal</p>
            </CardContent>
          </Card>
        </Link>

        {openInvoices !== null && (
          <Link href="/dashboard/facturen" className="group">
            <Card className="transition-shadow group-hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Openstaande facturen
                </CardTitle>
                <Receipt className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {openInvoices}
                  </p>
                  {(overdueInvoices as number) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {overdueInvoices} verlopen
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-blue-600 group-hover:underline">
                  Bekijk facturen
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/support" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Open tickets
              </CardTitle>
              <Ticket className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {openTickets}
                </p>
                {ticketsLastWeek > 0 && (
                  <span className="flex items-center text-xs text-slate-500">
                    +{ticketsLastWeek} deze week
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-600 group-hover:underline">
                Bekijk tickets
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main content grid */}
      {hasData ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity feed - takes 2/3 */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Recente activiteit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((event) => {
                    const Icon = activityIcons[event.type] || Activity;
                    const color =
                      activityColors[event.type] || "text-slate-500";
                    return (
                      <Link
                        key={event.id}
                        href={event.link || "#"}
                        className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className={`mt-0.5 shrink-0 ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {event.title}
                          </p>
                          {event.message && (
                            <p className="text-xs text-slate-500 truncate">
                              {event.message}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                          {formatDistanceToNow(event.createdAt, {
                            addSuffix: true,
                            locale: nl,
                          })}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">
                  Nog geen activiteit. Activiteiten verschijnen hier zodra er
                  wijzigingen zijn in je projecten, tickets of facturen.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Deadlines sidebar - takes 1/3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4" />
                Komende deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deadlines.length > 0 ? (
                <div className="space-y-3">
                  {deadlines.slice(0, 6).map((d, i) => {
                    const daysUntil = Math.ceil(
                      (d.date.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    const isUrgent = daysUntil <= 3;
                    const isOverdue = "overdue" in d && d.overdue;
                    return (
                      <Link
                        key={i}
                        href={d.link}
                        className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                            isOverdue
                              ? "bg-red-500"
                              : isUrgent
                                ? "bg-orange-500"
                                : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {d.label}
                          </p>
                          <p className="text-xs text-slate-500">{d.sublabel}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-xs font-medium ${
                              isOverdue
                                ? "text-red-600"
                                : isUrgent
                                  ? "text-orange-600"
                                  : "text-slate-600"
                            }`}
                          >
                            {isOverdue
                              ? "Verlopen"
                              : daysUntil === 0
                                ? "Vandaag"
                                : daysUntil === 1
                                  ? "Morgen"
                                  : `${daysUntil} dagen`}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">
                  Geen deadlines in de komende 2 weken.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-sm font-medium text-slate-700 mb-1">
              Welkom bij je klantenportaal
            </p>
            <p className="text-xs text-slate-500 text-center max-w-md mb-4">
              Je account is klaar. Zodra er projecten, facturen of tickets
              worden aangemaakt verschijnen ze hier. Heb je een vraag? Maak een
              supportticket aan.
            </p>
            <Link href="/dashboard/support">
              <Button size="sm">
                <Ticket className="mr-2 h-4 w-4" />
                Nieuw ticket aanmaken
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Snelle acties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/projecten" className="group">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-all hover:border-slate-300 hover:shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <FolderKanban className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Projecten
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeProjects} actief
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>

            <Link href="/dashboard/support" className="group">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-all hover:border-slate-300 hover:shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                  <Ticket className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Support</p>
                  <p className="text-xs text-slate-500">
                    {openTickets > 0 ? `${openTickets} open` : "Nieuw ticket"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>

            {enabledModules.includes("facturatie") && (
              <Link href="/dashboard/facturen" className="group">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-all hover:border-slate-300 hover:shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                    <Receipt className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Facturen
                    </p>
                    <p className="text-xs text-slate-500">
                      {openInvoices ? `${openInvoices} openstaand` : "Bekijken"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            )}

            {enabledModules.includes("website") && (
              <Link href="/dashboard/website" className="group">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-all hover:border-slate-300 hover:shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                    <Globe className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Website
                    </p>
                    <p className="text-xs text-slate-500">
                      {websiteStatus?.isOnline ? "Online" : "Status bekijken"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
