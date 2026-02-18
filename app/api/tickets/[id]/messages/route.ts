import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { success, error, unauthorized, notFound } from "@/lib/api/response";
import { logActivity } from "@/lib/activity";
import { notifyAdmins } from "@/lib/notifications";

const createMessageSchema = z.object({
  content: z.string().min(1, "Bericht is verplicht"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const { id } = await params;

  // Verify ticket exists and belongs to tenant
  const ticket = await db.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    return notFound("Ticket");
  }

  if (ticket.tenantId !== user.tenantId) {
    return notFound("Ticket");
  }

  const body = await req.json();
  const parsed = createMessageSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const { content } = parsed.data;

  const message = await db.$transaction(async (tx) => {
    const newMessage = await tx.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        senderRole: user.role,
        content,
      },
    });

    await tx.ticket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return newMessage;
  });

  await logActivity(user.tenantId, "TICKET_REPLY", "Nieuw bericht op ticket", {
    message: ticket.subject,
    link: `/dashboard/support/${id}`,
    metadata: { ticketId: id, senderRole: user.role },
  });

  await notifyAdmins(
    "Nieuw bericht op ticket",
    `${user.name}: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
    `/admin/tickets/${id}`,
  );

  return success(message, 201);
}
