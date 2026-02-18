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
import {
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
  Ticket,
  MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  IN_BEHANDELING: "bg-orange-50 text-orange-700",
  GESLOTEN: "bg-slate-100 text-slate-600",
};

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_BEHANDELING: "In behandeling",
  GESLOTEN: "Gesloten",
};

const priorityColors: Record<string, string> = {
  LAAG: "bg-slate-100 text-slate-600",
  NORMAAL: "bg-blue-50 text-blue-700",
  HOOG: "bg-orange-50 text-orange-700",
  URGENT: "bg-red-50 text-red-700",
};

const priorityLabels: Record<string, string> = {
  LAAG: "Laag",
  NORMAAL: "Normaal",
  HOOG: "Hoog",
  URGENT: "Urgent",
};

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    prioriteit?: string;
    klant?: string;
  }>;
}) {
  await requireAdmin();
  const {
    status: filterStatus,
    prioriteit: filterPriority,
    klant: filterTenant,
  } = await searchParams;

  const where: any = {};
  if (filterStatus && filterStatus !== "alle") {
    where.status = filterStatus;
  }
  if (filterPriority && filterPriority !== "alle") {
    where.priority = filterPriority;
  }
  if (filterTenant && filterTenant !== "alle") {
    where.tenantId = filterTenant;
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [tickets, openCount, inProgressCount, closedCount, tenants] =
    await Promise.all([
      db.ticket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          tenant: { select: { companyName: true } },
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { senderRole: true, createdAt: true },
          },
        },
      }),
      db.ticket.count({ where: { status: "OPEN" } }),
      db.ticket.count({ where: { status: "IN_BEHANDELING" } }),
      db.ticket.count({ where: { status: "GESLOTEN" } }),
      db.tenant.findMany({
        where: { active: true },
        select: { id: true, companyName: true },
        orderBy: { companyName: "asc" },
      }),
    ]);

  const activeFilter = filterStatus || "alle";
  const activePriority = filterPriority || "alle";
  const activeTenant = filterTenant || "alle";

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const values = {
      status: activeFilter,
      prioriteit: activePriority,
      klant: activeTenant,
      ...overrides,
    };
    Object.entries(values).forEach(([k, v]) => {
      if (v && v !== "alle") params.set(k, v);
    });
    const qs = params.toString();
    return `/admin/tickets${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tickets</h2>
        <p className="text-sm text-slate-500">
          Alle support tickets van je klanten.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{openCount}</p>
                <p className="text-xs text-slate-500">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {inProgressCount}
                </p>
                <p className="text-xs text-slate-500">In behandeling</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {closedCount}
                </p>
                <p className="text-xs text-slate-500">Gesloten</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                <Ticket className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {openCount + inProgressCount + closedCount}
                </p>
                <p className="text-xs text-slate-500">Totaal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg border p-1">
          {[
            { value: "alle", label: "Alle" },
            { value: "OPEN", label: "Open" },
            { value: "IN_BEHANDELING", label: "In behandeling" },
            { value: "GESLOTEN", label: "Gesloten" },
          ].map((f) => (
            <Link
              key={f.value}
              href={buildUrl({ status: f.value })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === f.value
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
            { value: "alle", label: "Alle prioriteiten" },
            { value: "URGENT", label: "Urgent" },
            { value: "HOOG", label: "Hoog" },
            { value: "NORMAAL", label: "Normaal" },
            { value: "LAAG", label: "Laag" },
          ].map((f) => (
            <Link
              key={f.value}
              href={buildUrl({ prioriteit: f.value })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activePriority === f.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        {tenants.length > 1 && (
          <div className="flex gap-1 rounded-lg border p-1 overflow-x-auto">
            <Link
              href={buildUrl({ klant: "alle" })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTenant === "alle"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Alle klanten
            </Link>
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={buildUrl({ klant: t.id })}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTenant === t.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.companyName}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tickets table */}
      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">
                Geen tickets gevonden met deze filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Onderwerp</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioriteit</TableHead>
                  <TableHead>Wacht op</TableHead>
                  <TableHead className="text-right">Berichten</TableHead>
                  <TableHead>Bijgewerkt</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const lastMsg = ticket.messages[0];
                  const waitingOnAdmin =
                    lastMsg &&
                    lastMsg.senderRole === "CLIENT" &&
                    ticket.status !== "GESLOTEN";
                  const waitingDuration = lastMsg
                    ? formatDistanceToNow(lastMsg.createdAt, {
                        locale: nl,
                      })
                    : null;

                  return (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Link
                          href={`/admin/tickets/${ticket.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                        >
                          {ticket.subject}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {ticket.tenant.companyName}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[ticket.status]}>
                          {statusLabels[ticket.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[ticket.priority]}>
                          {priorityLabels[ticket.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {waitingOnAdmin ? (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <Clock className="h-3 w-3" />
                            Jou ({waitingDuration})
                          </span>
                        ) : ticket.status !== "GESLOTEN" ? (
                          <span className="text-xs text-slate-400">Klant</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {ticket._count.messages}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {format(new Date(ticket.updatedAt), "d MMM yyyy", {
                          locale: nl,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3.5 w-3.5" />
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
