import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, error, unauthorized, notFound } from "@/lib/api/response";
import { logActivity } from "@/lib/activity";
import { notifyTenantUsers } from "@/lib/notifications";

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_BEHANDELING", "GESLOTEN"]).optional(),
  priority: z.enum(["LAAG", "NORMAAL", "HOOG", "URGENT"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) return notFound("Ticket");

  const updated = await db.ticket.update({
    where: { id },
    data: parsed.data,
  });

  if (parsed.data.status && parsed.data.status !== ticket.status) {
    const statusLabels: Record<string, string> = {
      OPEN: "Open",
      IN_BEHANDELING: "In behandeling",
      GESLOTEN: "Gesloten",
    };
    await logActivity(
      ticket.tenantId,
      "TICKET_STATUS_CHANGED",
      `Ticket status gewijzigd naar ${statusLabels[parsed.data.status]}`,
      {
        message: ticket.subject,
        link: `/dashboard/support/${id}`,
        metadata: {
          ticketId: id,
          oldStatus: ticket.status,
          newStatus: parsed.data.status,
        },
      },
    );

    await notifyTenantUsers(
      ticket.tenantId,
      "Ticket status gewijzigd",
      `Uw ticket "${ticket.subject}" is nu: ${statusLabels[parsed.data.status]}`,
      `/dashboard/support/${id}`,
    );
  }

  return success(updated);
}
