import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { AdminReplyForm } from "./admin-reply-form"
import { AdminTicketActions } from "./admin-ticket-actions"

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  IN_BEHANDELING: "bg-orange-50 text-orange-700",
  GESLOTEN: "bg-slate-100 text-slate-600",
}

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_BEHANDELING: "In behandeling",
  GESLOTEN: "Gesloten",
}

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      tenant: { select: { companyName: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, role: true } } },
      },
    },
  })

  if (!ticket) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{ticket.subject}</h2>
          <p className="text-sm text-slate-500">
            {ticket.tenant.companyName} — {format(new Date(ticket.createdAt), "d MMMM yyyy", { locale: nl })}
          </p>
        </div>
        <Badge className={statusColors[ticket.status]}>
          {statusLabels[ticket.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Berichten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border p-4 ${
                    msg.senderRole === "ADMIN"
                      ? "border-slate-200 bg-slate-50"
                      : "border-blue-100 bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {msg.sender.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {msg.senderRole === "ADMIN" ? "Admin" : "Klant"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {format(new Date(msg.createdAt), "d MMM yyyy HH:mm", { locale: nl })}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reply form */}
          {ticket.status !== "GESLOTEN" && (
            <AdminReplyForm ticketId={ticket.id} />
          )}
        </div>

        {/* Sidebar actions */}
        <AdminTicketActions ticketId={ticket.id} currentStatus={ticket.status} />
      </div>
    </div>
  )
}
