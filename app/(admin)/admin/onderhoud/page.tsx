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
import { format, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Shield,
  RefreshCw,
  Globe,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { AddMaintenanceDialog } from "./add-maintenance-dialog";

const typeColors: Record<string, string> = {
  UPDATE: "bg-blue-50 text-blue-700",
  BACKUP: "bg-green-50 text-green-700",
  SECURITY: "bg-orange-50 text-orange-700",
};

const typeLabels: Record<string, string> = {
  UPDATE: "Update",
  BACKUP: "Backup",
  SECURITY: "Beveiliging",
};

export default async function OnderhoudPage() {
  await requireAdmin();

  const [websites, logs, tenants] = await Promise.all([
    db.websiteStatus.findMany({
      include: { tenant: { select: { companyName: true, slug: true } } },
      orderBy: { lastCheck: "desc" },
    }),
    db.maintenanceLog.findMany({
      take: 50,
      orderBy: { performedAt: "desc" },
      include: { tenant: { select: { companyName: true } } },
    }),
    db.tenant.findMany({
      where: { active: true },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const onlineCount = websites.filter((w) => w.isOnline).length;
  const offlineCount = websites.filter((w) => !w.isOnline).length;
  const avgUptime =
    websites.length > 0
      ? websites.reduce((sum, w) => sum + w.uptimePercent, 0) / websites.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Onderhoud</h2>
          <p className="text-sm text-slate-500">
            Website monitoring en onderhoud overzicht.
          </p>
        </div>
        <AddMaintenanceDialog tenants={tenants} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Websites online
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
            <p className="text-xs text-slate-500">
              van {websites.length} gemonitord
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Websites offline
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{offlineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Gem. uptime
            </CardTitle>
            <Globe className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {avgUptime.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Onderhoud acties
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
            <p className="text-xs text-slate-500">laatste 50</p>
          </CardContent>
        </Card>
      </div>

      {/* SSL Warnings */}
      {(() => {
        const now = new Date();
        const sslWarnings = websites.filter((w) => {
          if (!w.sslExpiry) return false;
          const daysLeft = differenceInDays(w.sslExpiry, now);
          return daysLeft >= 0 && daysLeft <= 30;
        });
        const sslExpired = websites.filter((w) => {
          if (!w.sslExpiry) return false;
          return differenceInDays(w.sslExpiry, now) < 0;
        });

        if (sslWarnings.length === 0 && sslExpired.length === 0) return null;

        return (
          <div className="space-y-2">
            {sslExpired.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              >
                <Shield className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-800 flex-1">
                  <strong>{w.tenant.companyName}</strong> — SSL certificaat is
                  verlopen
                </p>
              </div>
            ))}
            {sslWarnings.map((w) => {
              const daysLeft = differenceInDays(w.sslExpiry!, now);
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3"
                >
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                  <p className="text-sm text-orange-800 flex-1">
                    <strong>{w.tenant.companyName}</strong> — SSL certificaat
                    verloopt over <strong>{daysLeft} dagen</strong>
                  </p>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Website Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Website Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {websites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-slate-500">
                Nog geen websites gemonitord.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klant</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Laadtijd</TableHead>
                  <TableHead>SSL verloopt</TableHead>
                  <TableHead>Laatste check</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {websites.map((ws) => (
                  <TableRow key={ws.id}>
                    <TableCell className="font-medium">
                      {ws.tenant.companyName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {ws.url}
                    </TableCell>
                    <TableCell>
                      {ws.isOnline ? (
                        <Badge className="bg-green-50 text-green-700">
                          Online
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700">
                          Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{ws.uptimePercent.toFixed(1)}%</TableCell>
                    <TableCell>
                      {ws.loadTime ? `${ws.loadTime.toFixed(1)}s` : "—"}
                    </TableCell>
                    <TableCell>
                      {ws.sslExpiry
                        ? (() => {
                            const daysLeft = differenceInDays(
                              ws.sslExpiry,
                              new Date(),
                            );
                            const color =
                              daysLeft < 0
                                ? "text-red-600 font-medium"
                                : daysLeft <= 30
                                  ? "text-orange-600 font-medium"
                                  : "text-slate-500";
                            return (
                              <span className={color}>
                                {format(new Date(ws.sslExpiry), "d MMM yyyy", {
                                  locale: nl,
                                })}
                                {daysLeft < 0
                                  ? " (verlopen)"
                                  : daysLeft <= 30
                                    ? ` (${daysLeft}d)`
                                    : ""}
                              </span>
                            );
                          })()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {format(new Date(ws.lastCheck), "d MMM HH:mm", {
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

      {/* Maintenance Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Onderhoud Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-slate-500">
                Nog geen onderhoud uitgevoerd.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klant</TableHead>
                  <TableHead>Beschrijving</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.tenant.companyName}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {log.description}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[log.type]}>
                        {typeLabels[log.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {format(new Date(log.performedAt), "d MMM yyyy", {
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
    </div>
  );
}
