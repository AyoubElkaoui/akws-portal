import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { tenantScope } from "@/lib/db/tenant";
import { success, error, unauthorized } from "@/lib/api/response";
import { logActivity } from "@/lib/activity";
import { notifyAdmins } from "@/lib/notifications";

const createTicketSchema = z.object({
  subject: z.string().min(1, "Onderwerp is verplicht"),
  priority: z.enum(["LAAG", "NORMAAL", "HOOG", "URGENT"], {
    message: "Ongeldige prioriteit",
  }),
  message: z.string().min(1, "Bericht is verplicht"),
});

export async function GET() {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const tickets = await db.ticket.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
    },
  });

  return success(tickets);
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const body = await req.json();
  const parsed = createTicketSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const { subject, priority, message } = parsed.data;

  const ticket = await db.$transaction(async (tx) => {
    const newTicket = await tx.ticket.create({
      data: {
        tenantId: user.tenantId,
        subject,
        priority,
      },
    });

    await tx.ticketMessage.create({
      data: {
        ticketId: newTicket.id,
        senderId: user.id,
        senderRole: user.role,
        content: message,
      },
    });

    return newTicket;
  });

  await logActivity(
    user.tenantId,
    "TICKET_CREATED",
    "Nieuw supportticket aangemaakt",
    {
      message: subject,
      link: `/dashboard/support/${ticket.id}`,
      metadata: { ticketId: ticket.id, priority },
    },
  );

  await notifyAdmins(
    "Nieuw supportticket",
    `${user.name} heeft een ticket aangemaakt: ${subject}`,
    `/admin/tickets/${ticket.id}`,
  );

  return success(ticket, 201);
}
