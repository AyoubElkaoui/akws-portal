import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { tenantScope } from "@/lib/db/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Eye,
  Users,
  Monitor,
  Smartphone,
  Globe,
} from "lucide-react";

export default async function StatistiekenPage() {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "statistieken"))) {
    redirect("/dashboard");
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [todayViews, weekViews, monthViews, topPages, topReferrers, devices] =
    await Promise.all([
      db.pageView.count({
        where: { ...tenantScope(user.tenantId), createdAt: { gte: today } },
      }),
      db.pageView.count({
        where: { ...tenantScope(user.tenantId), createdAt: { gte: weekAgo } },
      }),
      db.pageView.count({
        where: { ...tenantScope(user.tenantId), createdAt: { gte: monthAgo } },
      }),
      db.pageView.groupBy({
        by: ["page"],
        where: { ...tenantScope(user.tenantId), createdAt: { gte: monthAgo } },
        _count: { page: true },
        orderBy: { _count: { page: "desc" } },
        take: 10,
      }),
      db.pageView.groupBy({
        by: ["referrer"],
        where: {
          ...tenantScope(user.tenantId),
          createdAt: { gte: monthAgo },
          referrer: { not: null },
        },
        _count: { referrer: true },
        orderBy: { _count: { referrer: "desc" } },
        take: 10,
      }),
      db.pageView.groupBy({
        by: ["device"],
        where: {
          ...tenantScope(user.tenantId),
          createdAt: { gte: monthAgo },
          device: { not: null },
        },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
    ]);

  const totalDevices = devices.reduce((sum, d) => sum + d._count.device, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Statistieken</h2>
        <p className="text-sm text-slate-500">
          Bekijk bezoekersdata en website-analyses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Vandaag</p>
              <p className="text-xl font-bold text-slate-900">{todayViews}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Deze week</p>
              <p className="text-xl font-bold text-slate-900">{weekViews}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Afgelopen 30 dagen</p>
              <p className="text-xl font-bold text-slate-900">{monthViews}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {monthViews === 0 && (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <BarChart3 className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Nog geen bezoekersdata
            </p>
            <p className="text-xs text-slate-500 text-center max-w-md">
              Voeg het tracking-script toe aan je website om bezoekersdata te
              verzamelen. Neem contact op met support voor hulp bij de
              installatie.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Populairste pagina&apos;s
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Nog geen paginaweergaven geregistreerd.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pagina</TableHead>
                    <TableHead className="text-right">Weergaven</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPages.map((p) => (
                    <TableRow key={p.page}>
                      <TableCell className="font-medium text-slate-900">
                        {p.page}
                      </TableCell>
                      <TableCell className="text-right text-slate-500">
                        {p._count.page}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verkeersbronnen</CardTitle>
          </CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Nog geen verkeersbronnen geregistreerd.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bron</TableHead>
                    <TableHead className="text-right">Bezoeken</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topReferrers.map((r) => (
                    <TableRow key={r.referrer}>
                      <TableCell className="font-medium text-slate-900">
                        {r.referrer || "Direct"}
                      </TableCell>
                      <TableCell className="text-right text-slate-500">
                        {r._count.referrer}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apparaten</CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Nog geen apparaatdata beschikbaar.
              </p>
            ) : (
              <div className="space-y-3">
                {devices.map((d) => {
                  const percentage =
                    totalDevices > 0
                      ? Math.round((d._count.device / totalDevices) * 100)
                      : 0;
                  const Icon =
                    d.device === "mobile"
                      ? Smartphone
                      : d.device === "desktop"
                        ? Monitor
                        : Globe;

                  return (
                    <div key={d.device} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700 capitalize">
                            {d.device}
                          </span>
                          <span className="text-slate-500">{percentage}%</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
