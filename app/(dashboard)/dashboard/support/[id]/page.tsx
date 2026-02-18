import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenant } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { ReplyForm } from "./reply-form";
import { ScrollToBottom } from "./scroll-to-bottom";

const statusConfig: Record<
  string,
  { label: string; className: string; step: number }
> = {
  OPEN: {
    label: "Open",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    step: 1,
  },
  IN_BEHANDELING: {
    label: "In behandeling",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    step: 2,
  },
  GESLOTEN: {
    label: "Gesloten",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
    step: 3,
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
    return `${days} dag${days !== 1 ? "en" : ""}`;
  }
  if (hours > 0) return `${hours}u ${minutes}m`;
  return `${minutes} minuten`;
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireTenant();
  const { id } = await params;

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
        },
      },
    },
  });

  if (!ticket || ticket.tenantId !== user.tenantId) {
    notFound();
  }

  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];
  const currentStep = status.step;

  // Calculate first response time
  let firstResponseTime: number | null = null;
  if (ticket.messages.length >= 2) {
    const firstClientMsg = ticket.messages.find(
      (m) => m.senderRole === "CLIENT",
    );
    const firstAdminMsg = ticket.messages.find((m) => m.senderRole === "ADMIN");
    if (firstClientMsg && firstAdminMsg) {
      firstResponseTime =
        firstAdminMsg.createdAt.getTime() - firstClientMsg.createdAt.getTime();
    }
  }

  const steps = [
    { label: "Open", step: 1 },
    { label: "In behandeling", step: 2 },
    { label: "Gesloten", step: 3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/support">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar overzicht
          </Button>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {ticket.subject}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Aangemaakt op {formatDate(ticket.createdAt)}
              {firstResponseTime && (
                <span className="ml-3 inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Reactietijd: {formatDuration(firstResponseTime)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={priority.className}>
              {priority.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Status flow indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                  currentStep >= s.step
                    ? currentStep === s.step
                      ? "bg-blue-600 text-white"
                      : "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {currentStep > s.step ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{s.step}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  currentStep >= s.step ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-full min-w-4 ${
                  currentStep > s.step ? "bg-green-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <ScrollToBottom />
      <div className="space-y-4">
        {ticket.messages.map((message) => {
          const isClient = message.senderRole === "CLIENT";

          return (
            <div
              key={message.id}
              className={`flex ${isClient ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[80%] ${
                  isClient
                    ? "bg-blue-50 border-blue-100"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-sm font-medium text-slate-900">
                      {message.sender.name}
                      <Badge
                        variant="secondary"
                        className={`ml-2 text-xs ${
                          isClient
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isClient ? "Klant" : "Support"}
                      </Badge>
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {message.content}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {ticket.status !== "GESLOTEN" ? (
        <ReplyForm ticketId={ticket.id} />
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Dit ticket is gesloten. Heb je nog een vraag? Maak een nieuw
              ticket aan.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
