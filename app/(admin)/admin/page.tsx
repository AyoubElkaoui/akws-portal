import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Receipt,
  Ticket,
  TrendingUp,
  AlertTriangle,
  Globe,
  Clock,
  Activity,
  MessageSquare,
  FileCheck,
  Send,
  ArrowRight,
  CircleDot,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLAN_PRICES } from "@/types";
import type { Plan } from "@prisma/client";
import { calculateHealthScores } from "@/lib/health-score";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const activityIcons: Record<string, typeof Activity> = {
  TICKET_CREATED: Ticket,
  TICKET_REPLY: MessageSquare,
  TICKET_STATUS_CHANGED: Ticket,
  MILESTONE_COMPLETED: FileCheck,
  INVOICE_SENT: Send,
  WEBSITE_DOWN: AlertTriangle,
  WEBSITE_UP: Globe,
};

const activityColors: Record<string, string> = {
  TICKET_CREATED: "text-blue-500",
  TICKET_REPLY: "text-blue-500",
  TICKET_STATUS_CHANGED: "text-orange-500",
  MILESTONE_COMPLETED: "text-green-500",
  INVOICE_SENT: "text-indigo-500",
  WEBSITE_DOWN: "text-red-500",
  WEBSITE_UP: "text-green-500",
};

const healthColors = {
  healthy: "bg-green-500",
  warning: "bg-yellow-500",
  critical: "bg-red-500",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    tenantCount,
    activeTickets,
    tenantsByPlan,
    totalInvoices,
    overdueInvoices,
    offlineWebsites,
    unansweredTickets,
    recentActivity,
    healthScores,
    recentTenants,
  ] = await Promise.all([
    db.tenant.count({ where: { active: true } }),
    db.ticket.count({ where: { status: { in: ["OPEN", "IN_BEHANDELING"] } } }),
    db.tenant.groupBy({
      by: ["plan"],
      where: { active: true },
      _count: { plan: true },
    }),
    db.invoice.count(),
    db.invoice.count({ where: { status: "VERLOPEN" } }),
    db.websiteStatus.count({ where: { isOnline: false } }),
    db.ticket.count({
      where: {
        status: { in: ["OPEN", "IN_BEHANDELING"] },
        messages: {
          every: { senderRole: "CLIENT" },
        },
        updatedAt: { lt: twentyFourHoursAgo },
      },
    }),
    db.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { tenant: { select: { companyName: true } } },
    }),
    calculateHealthScores(),
    db.tenant.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true } } },
    }),
  ]);

  const mrr = tenantsByPlan.reduce((total, group) => {
    return total + group._count.plan * PLAN_PRICES[group.plan as Plan];
  }, 0);

  // Count alerts
  const alerts = [];
  if (offlineWebsites > 0) {
    alerts.push({
      type: "critical",
      icon: Globe,
      message: `${offlineWebsites} website${offlineWebsites > 1 ? "s" : ""} offline`,
      link: "/admin/onderhoud",
    });
  }
  if (overdueInvoices > 0) {
    alerts.push({
      type: "critical",
      icon: Receipt,
      message: `${overdueInvoices} verlopen factuur${overdueInvoices > 1 ? "en" : ""}`,
      link: "/admin/facturatie",
    });
  }
  if (unansweredTickets > 0) {
    alerts.push({
      type: "warning",
      icon: Clock,
      message: `${unansweredTickets} onbeantwoorde ticket${unansweredTickets > 1 ? "s" : ""} (>24u)`,
      link: "/admin/tickets",
    });
  }

  const criticalTenants = healthScores.filter((h) => h.status === "critical");
  const warningTenants = healthScores.filter((h) => h.status === "warning");
  const healthyTenants = healthScores.filter((h) => h.status === "healthy");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Overzicht</h2>
        <p className="text-sm text-slate-500">
          Welkom terug. Hier is een overzicht van je platform.
        </p>
      </div>

      {/* Alert banners */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Link key={i} href={alert.link}>
              <div
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-opacity-80 ${
                  alert.type === "critical"
                    ? "border-red-200 bg-red-50"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <alert.icon
                  className={`h-5 w-5 shrink-0 ${
                    alert.type === "critical"
                      ? "text-red-500"
                      : "text-orange-500"
                  }`}
                />
                <p
                  className={`text-sm font-medium flex-1 ${
                    alert.type === "critical"
                      ? "text-red-800"
                      : "text-orange-800"
                  }`}
                >
                  {alert.message}
                </p>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Actieve klanten
            </CardTitle>
            <div className="rounded-lg p-2 bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{tenantCount}</p>
            <div className="flex gap-2 mt-1">
              {(["STARTER", "BUSINESS", "PREMIUM"] as const).map((plan) => {
                const count =
                  tenantsByPlan.find((g) => g.plan === plan)?._count.plan || 0;
                if (count === 0) return null;
                return (
                  <span key={plan} className="text-xs text-slate-400">
                    {count} {plan.charAt(0) + plan.slice(1).toLowerCase()}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Maandelijkse omzet
            </CardTitle>
            <div className="rounded-lg p-2 bg-green-50">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              &euro;{mrr.toLocaleString("nl-NL")}
            </p>
            <p className="text-xs text-slate-400 mt-1">MRR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Open tickets
            </CardTitle>
            <div className="rounded-lg p-2 bg-orange-50">
              <Ticket className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{activeTickets}</p>
            {unansweredTickets > 0 && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {unansweredTickets} wacht op antwoord
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Facturen
            </CardTitle>
            <div className="rounded-lg p-2 bg-purple-50">
              <Receipt className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totalInvoices}</p>
            {overdueInvoices > 0 && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {overdueInvoices} verlopen
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity feed - 2/3 */}
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
                  const color = activityColors[event.type] || "text-slate-500";
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`mt-0.5 shrink-0 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">
                            {event.tenant.companyName}
                          </span>{" "}
                          — {event.title}
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Nog geen activiteit geregistreerd.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Health scores sidebar - 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Klant gezondheid</CardTitle>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CircleDot className="h-3 w-3 text-green-500" />
                {healthyTenants.length} gezond
              </span>
              <span className="flex items-center gap-1">
                <CircleDot className="h-3 w-3 text-yellow-500" />
                {warningTenants.length} aandacht
              </span>
              <span className="flex items-center gap-1">
                <CircleDot className="h-3 w-3 text-red-500" />
                {criticalTenants.length} kritiek
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {healthScores.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Geen klanten.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Show critical and warning first, then healthy */}
                {[...criticalTenants, ...warningTenants, ...healthyTenants]
                  .slice(0, 10)
                  .map((h) => (
                    <Link
                      key={h.tenantId}
                      href={`/admin/klanten/${h.tenantId}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${healthColors[h.status]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {h.companyName}
                        </p>
                        {h.issues.length > 0 && (
                          <p className="text-xs text-slate-500 truncate">
                            {h.issues.join(" · ")}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions and plan distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Snelle acties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/admin/klanten">
                <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Klanten beheren
                  </span>
                </div>
              </Link>
              <Link href="/admin/tickets">
                <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                  <Ticket className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Open tickets
                  </span>
                </div>
              </Link>
              <Link href="/admin/facturatie">
                <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                  <Receipt className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Facturatie
                  </span>
                </div>
              </Link>
              <Link href="/admin/onderhoud">
                <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Website monitoring
                  </span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Klanten per pakket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(["STARTER", "BUSINESS", "PREMIUM"] as const).map((plan) => {
                const count =
                  tenantsByPlan.find((g) => g.plan === plan)?._count.plan || 0;
                const percentage =
                  tenantCount > 0 ? (count / tenantCount) * 100 : 0;
                return (
                  <div key={plan} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {plan.charAt(0) + plan.slice(1).toLowerCase()}
                        <span className="text-slate-400 ml-1">
                          (&euro;{PLAN_PRICES[plan]}/mnd)
                        </span>
                      </span>
                      <span className="text-slate-500">
                        {count} klant{count !== 1 ? "en" : ""} &middot; &euro;
                        {(count * PLAN_PRICES[plan]).toLocaleString("nl-NL")}
                        /mnd
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
