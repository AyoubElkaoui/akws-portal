import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, Users, CircleDot } from "lucide-react";
import { PLAN_LABELS, PLAN_PRICES } from "@/types";
import { AddTenantDialog } from "./add-tenant-dialog";
import { calculateHealthScores } from "@/lib/health-score";

const healthColors = {
  healthy: "bg-green-500",
  warning: "bg-yellow-500",
  critical: "bg-red-500",
};

export default async function KlantenPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; status?: string; q?: string }>;
}) {
  await requireAdmin();
  const {
    plan: filterPlan,
    status: filterStatus,
    q: searchQuery,
  } = await searchParams;

  const where: any = {};
  if (filterPlan && filterPlan !== "alle") {
    where.plan = filterPlan;
  }
  if (filterStatus === "actief") {
    where.active = true;
  } else if (filterStatus === "inactief") {
    where.active = false;
  }
  if (searchQuery) {
    where.OR = [
      { companyName: { contains: searchQuery, mode: "insensitive" } },
      { slug: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const [tenants, healthScores] = await Promise.all([
    db.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, projects: true, invoices: true } },
      },
    }),
    calculateHealthScores(),
  ]);

  const healthMap = new Map(healthScores.map((h) => [h.tenantId, h]));

  const activePlan = filterPlan || "alle";
  const activeStatus = filterStatus || "alle";

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const values = {
      plan: activePlan,
      status: activeStatus,
      q: searchQuery || "",
      ...overrides,
    };
    Object.entries(values).forEach(([k, v]) => {
      if (v && v !== "alle" && v !== "") params.set(k, v);
    });
    const qs = params.toString();
    return `/admin/klanten${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Klanten</h2>
          <p className="text-sm text-slate-500">
            Beheer al je klanten en hun pakketten.
          </p>
        </div>
        <AddTenantDialog />
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-2">
        <form
          action="/admin/klanten"
          method="get"
          className="flex-1 min-w-[200px] max-w-sm"
        >
          <input
            type="text"
            name="q"
            placeholder="Zoek op bedrijfsnaam..."
            defaultValue={searchQuery || ""}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </form>
        <div className="flex gap-1 rounded-lg border p-1">
          {[
            { value: "alle", label: "Alle plannen" },
            { value: "STARTER", label: "Starter" },
            { value: "BUSINESS", label: "Business" },
            { value: "PREMIUM", label: "Premium" },
          ].map((f) => (
            <Link
              key={f.value}
              href={buildUrl({ plan: f.value })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activePlan === f.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {[
            { value: "alle", label: "Alle" },
            { value: "actief", label: "Actief" },
            { value: "inactief", label: "Inactief" },
          ].map((f) => (
            <Link
              key={f.value}
              href={buildUrl({ status: f.value })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeStatus === f.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">
                {searchQuery
                  ? `Geen klanten gevonden voor "${searchQuery}"`
                  : "Je hebt nog geen klanten."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Bedrijf</TableHead>
                  <TableHead>Pakket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gebruikers</TableHead>
                  <TableHead className="text-right">Projecten</TableHead>
                  <TableHead className="text-right">Facturen</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const health = healthMap.get(tenant.id);
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            health
                              ? healthColors[health.status]
                              : "bg-slate-300"
                          }`}
                          title={
                            health
                              ? health.issues.length > 0
                                ? health.issues.join(", ")
                                : "Alles in orde"
                              : "Onbekend"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {tenant.companyName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tenant.slug}
                            {health && health.issues.length > 0 && (
                              <span className="ml-2 text-red-500">
                                {health.issues[0]}
                              </span>
                            )}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {PLAN_LABELS[tenant.plan]} — &euro;
                          {PLAN_PRICES[tenant.plan]}/mnd
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tenant.active ? "default" : "destructive"}
                          className={
                            tenant.active
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : ""
                          }
                        >
                          {tenant.active ? "Actief" : "Inactief"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {tenant._count.users}
                      </TableCell>
                      <TableCell className="text-right">
                        {tenant._count.projects}
                      </TableCell>
                      <TableCell className="text-right">
                        {tenant._count.invoices}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/klanten/${tenant.id}`}>
                          <Button variant="ghost" size="sm">
                            Bekijken
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
