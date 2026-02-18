import Link from "next/link";
import { requireTenant } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { tenantScope } from "@/lib/db/tenant";
import { Badge } from "@/components/ui/badge";
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
  MessageSquare,
  Clock,
  Ticket,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CreateTicketDialog } from "./create-ticket-dialog";

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: "Open",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  IN_BEHANDELING: {
    label: "In behandeling",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  GESLOTEN: {
    label: "Gesloten",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LAAG: {
    label: "Laag",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  NORMAAL: {
    label: "Normaal",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  HOOG: {
    label: "Hoog",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDuration(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
  if (hours > 0) return `${hours}u ${minutes}m`;
  return `${minutes}m`;
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioriteit?: string }>;
}) {
  const user = await requireTenant();
  const { status: filterStatus, prioriteit: filterPriority } =
    await searchParams;

  const where: any = { ...tenantScope(user.tenantId) };
  if (filterStatus && filterStatus !== "alle") {
    where.status = filterStatus;
  }
  if (filterPriority && filterPriority !== "alle") {
    where.priority = filterPriority;
  }

  const [tickets, openCount, inProgressCount, closedCount] = await Promise.all([
    db.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 2,
          select: { createdAt: true, senderRole: true },
        },
      },
    }),
    db.ticket.count({
      where: { ...tenantScope(user.tenantId), status: "OPEN" },
    }),
    db.ticket.count({
      where: { ...tenantScope(user.tenantId), status: "IN_BEHANDELING" },
    }),
    db.ticket.count({
      where: { ...tenantScope(user.tenantId), status: "GESLOTEN" },
    }),
  ]);

  // Calculate average first response time
  let totalResponseTime = 0;
  let responseCount = 0;
  for (const ticket of tickets) {
    if (ticket.messages.length >= 2) {
      const firstMsg = ticket.messages[0];
      const secondMsg = ticket.messages[1];
      if (
        firstMsg.senderRole === "CLIENT" &&
        secondMsg.senderRole === "ADMIN"
      ) {
        totalResponseTime +=
          secondMsg.createdAt.getTime() - firstMsg.createdAt.getTime();
        responseCount++;
      }
    }
  }
  const avgResponseTime =
    responseCount > 0 ? totalResponseTime / responseCount : null;

  const activeFilter = filterStatus || "alle";
  const activePriority = filterPriority || "alle";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Support</h2>
          <p className="text-sm text-slate-500">
            Heb je een vraag of probleem? Neem contact met ons op.
          </p>
        </div>
        <CreateTicketDialog />
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
                  {avgResponseTime ? formatDuration(avgResponseTime) : "—"}
                </p>
                <p className="text-xs text-slate-500">Gem. reactietijd</p>
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
              href={`/dashboard/support?status=${f.value}${activePriority !== "alle" ? `&prioriteit=${activePriority}` : ""}`}
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
              href={`/dashboard/support?prioriteit=${f.value}${activeFilter !== "alle" ? `&status=${activeFilter}` : ""}`}
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
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              {activeFilter !== "alle" || activePriority !== "alle"
                ? "Geen tickets gevonden met deze filters"
                : "Geen tickets"}
            </p>
            <p className="text-xs text-slate-500 text-center max-w-sm">
              {activeFilter !== "alle" || activePriority !== "alle"
                ? "Probeer andere filters of maak een nieuw ticket aan."
                : "Heb je een vraag of probleem? Maak een ticket aan en we helpen je zo snel mogelijk."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Onderwerp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioriteit</TableHead>
                  <TableHead>Berichten</TableHead>
                  <TableHead>Laatst bijgewerkt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const status = statusConfig[ticket.status];
                  const priority = priorityConfig[ticket.priority];

                  return (
                    <TableRow key={ticket.id} className="group">
                      <TableCell>
                        <Link
                          href={`/dashboard/support/${ticket.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                        >
                          {ticket.subject}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={priority.className}
                        >
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {ticket._count.messages}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(ticket.updatedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
