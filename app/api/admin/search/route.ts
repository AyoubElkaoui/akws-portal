import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, unauthorized } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return success({ tenants: [], tickets: [], invoices: [] });
  }

  const [tenants, tickets, invoices] = await Promise.all([
    db.tenant.findMany({
      where: {
        OR: [
          { companyName: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, companyName: true, slug: true, plan: true },
      take: 5,
    }),
    db.ticket.findMany({
      where: {
        subject: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        subject: true,
        status: true,
        tenant: { select: { companyName: true } },
      },
      take: 5,
    }),
    db.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" } },
          { customerName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        total: true,
        status: true,
      },
      take: 5,
    }),
  ]);

  return success({ tenants, tickets, invoices });
}
