import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { tenantScope } from "@/lib/db/tenant";
import { success, error, unauthorized } from "@/lib/api/response";

const createAppointmentSchema = z.object({
  customerName: z.string().min(1, "Klantnaam is verplicht"),
  customerEmail: z.string().email("Ongeldig e-mailadres"),
  customerPhone: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Datum is verplicht"),
  startTime: z.string().min(1, "Starttijd is verplicht"),
  endTime: z.string().min(1, "Eindtijd is verplicht"),
  notes: z.string().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const from = searchParams.get("from");

  const where: any = { ...tenantScope(user.tenantId) };
  if (status) where.status = status;
  if (from) where.date = { gte: new Date(from) };

  const appointments = await db.appointment.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return success(appointments);
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const body = await req.json();
  const parsed = createAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const appointmentDate = new Date(parsed.data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    return error("Afspraakdatum kan niet in het verleden liggen");
  }

  const appointment = await db.appointment.create({
    data: {
      tenantId: user.tenantId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone || null,
      date: new Date(parsed.data.date),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      notes: parsed.data.notes || null,
    },
  });

  return success(appointment, 201);
}
