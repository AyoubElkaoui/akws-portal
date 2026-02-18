import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled, tenantScope } from "@/lib/db/tenant";
import { db } from "@/lib/db";
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
import {
  CheckCircle2,
  AlertCircle,
  Globe,
  Shield,
  Zap,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format, differenceInDays, subDays } from "date-fns";
import { nl } from "date-fns/locale";
import { UptimeChart, LoadTimeChart } from "./charts";

function getUptimeColor(percent: number) {
  if (percent > 99) return "text-green-600";
  if (percent > 95) return "text-orange-500";
  return "text-red-600";
}

function getLoadTimeColor(loadTime: number | null) {
  if (loadTime === null) return "text-slate-400";
  if (loadTime < 2) return "text-green-600";
  if (loadTime < 4) return "text-orange-500";
  return "text-red-600";
}

function getSslColor(sslExpiry: Date | null) {
  if (!sslExpiry) return "text-slate-400";
  const daysLeft = differenceInDays(sslExpiry, new Date());
  if (daysLeft < 0) return "text-red-600";
  if (daysLeft < 30) return "text-orange-500";
  return "text-green-600";
}

function getMaintenanceBadge(type: string) {
  switch (type) {
    case "UPDATE":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Update
        </Badge>
      );
    case "BACKUP":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Backup
        </Badge>
      );
    case "SECURITY":
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          Security
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

export default async function WebsitePage() {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "website"))) {
    redirect("/dashboard");
  }

  const scope = tenantScope(user.tenantId);
  const sevenDaysAgo = subDays(new Date(), 7);

  const [websiteStatus, maintenanceLogs, uptimeChecks, websiteAlerts] =
    await Promise.all([
      db.websiteStatus.findFirst({
        where: scope,
        orderBy: { lastCheck: "desc" },
      }),
      db.maintenanceLog.findMany({
        where: scope,
        orderBy: { performedAt: "desc" },
        take: 10,
      }),
      db.uptimeCheck.findMany({
        where: { ...scope, checkedAt: { gte: sevenDaysAgo } },
        orderBy: { checkedAt: "asc" },
      }),
      db.websiteAlert.findMany({
        where: scope,
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  // Prepare chart data - group by hour for the last 7 days
  const uptimeChartData = uptimeChecks.map((check) => ({
    time: check.checkedAt.toISOString(),
    online: check.isOnline ? 1 : 0,
    loadTime: check.loadTime,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Website Monitoring
        </h2>
        <p className="text-sm text-slate-500">
          Realtime status en prestaties van je website.
        </p>
      </div>

      {!websiteStatus ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              Er is nog geen website gekoppeld aan je account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* SSL warning banner */}
          {websiteStatus.sslExpiry &&
            (() => {
              const daysLeft = differenceInDays(
                websiteStatus.sslExpiry,
                new Date(),
              );
              if (daysLeft > 0 && daysLeft < 30) {
                return (
                  <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                    <Shield className="h-5 w-5 text-orange-500 shrink-0" />
                    <p className="text-sm text-orange-800">
                      Je SSL certificaat verloopt over{" "}
                      <strong>{daysLeft} dagen</strong>. Neem contact op als je
                      dit wilt verlengen.
                    </p>
                  </div>
                );
              }
              if (daysLeft <= 0) {
                return (
                  <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <Shield className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-800">
                      Je SSL certificaat is <strong>verlopen</strong>. Neem
                      direct contact op.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

          {/* Status overview cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {websiteStatus.isOnline ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <p
                      className={`text-2xl font-bold ${
                        websiteStatus.isOnline
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {websiteStatus.isOnline ? "Online" : "Offline"}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[160px]">
                      {websiteStatus.url}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Clock
                    className={`h-8 w-8 ${getUptimeColor(websiteStatus.uptimePercent)}`}
                  />
                  <div>
                    <p
                      className={`text-2xl font-bold ${getUptimeColor(websiteStatus.uptimePercent)}`}
                    >
                      {websiteStatus.uptimePercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      Laatste check:{" "}
                      {format(websiteStatus.lastCheck, "d MMM, HH:mm", {
                        locale: nl,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Laadtijd
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Zap
                    className={`h-8 w-8 ${getLoadTimeColor(websiteStatus.loadTime)}`}
                  />
                  <div>
                    <p
                      className={`text-2xl font-bold ${getLoadTimeColor(websiteStatus.loadTime)}`}
                    >
                      {websiteStatus.loadTime !== null
                        ? `${websiteStatus.loadTime.toFixed(1)}s`
                        : "—"}
                    </p>
                    <p className="text-xs text-slate-500">Responstijd</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  SSL Certificaat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Shield
                    className={`h-8 w-8 ${getSslColor(websiteStatus.sslExpiry)}`}
                  />
                  <div>
                    <p
                      className={`text-lg font-bold ${getSslColor(websiteStatus.sslExpiry)}`}
                    >
                      {websiteStatus.sslExpiry
                        ? format(websiteStatus.sslExpiry, "d MMM yyyy", {
                            locale: nl,
                          })
                        : "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {websiteStatus.sslExpiry
                        ? (() => {
                            const daysLeft = differenceInDays(
                              websiteStatus.sslExpiry,
                              new Date(),
                            );
                            if (daysLeft < 0) return "Verlopen";
                            if (daysLeft === 0) return "Verloopt vandaag";
                            return `Nog ${daysLeft} dagen`;
                          })()
                        : "Geen SSL info"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Uptime - Afgelopen 7 dagen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uptimeChartData.length > 0 ? (
                  <UptimeChart data={uptimeChartData} />
                ) : (
                  <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                    Nog geen historische data beschikbaar.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Laadtijd trend</CardTitle>
              </CardHeader>
              <CardContent>
                {uptimeChartData.filter((d) => d.loadTime !== null).length >
                0 ? (
                  <LoadTimeChart data={uptimeChartData} />
                ) : (
                  <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                    Nog geen laadtijd data beschikbaar.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alert history */}
          {websiteAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alert geschiedenis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {websiteAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center gap-3 rounded-lg border px-4 py-3"
                    >
                      {alert.type === "DOWN" ? (
                        <ArrowDown className="h-4 w-4 text-red-500 shrink-0" />
                      ) : alert.type === "UP" ? (
                        <ArrowUp className="h-4 w-4 text-green-500 shrink-0" />
                      ) : alert.type === "SSL_EXPIRING" ? (
                        <Shield className="h-4 w-4 text-orange-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">
                          {alert.message}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500">
                          {format(alert.createdAt, "d MMM, HH:mm", {
                            locale: nl,
                          })}
                        </p>
                        {alert.resolvedAt && (
                          <p className="text-xs text-green-600">
                            Opgelost{" "}
                            {format(alert.resolvedAt, "HH:mm", { locale: nl })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Onderhoud log</CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-sm text-slate-500">
                    Nog geen onderhoud uitgevoerd.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beschrijving</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.description}</TableCell>
                        <TableCell>{getMaintenanceBadge(log.type)}</TableCell>
                        <TableCell className="text-slate-500">
                          {format(log.performedAt, "d MMMM yyyy", {
                            locale: nl,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
