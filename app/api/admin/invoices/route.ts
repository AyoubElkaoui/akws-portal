import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, error, unauthorized } from "@/lib/api/response";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  quantity: z.number().min(0.01, "Aantal moet groter dan 0 zijn"),
  unitPrice: z.number().min(0, "Prijs moet 0 of hoger zijn"),
});

const createInvoiceSchema = z.object({
  tenantId: z.string().min(1, "Tenant is verplicht"),
  type: z.enum(["KLANT_FACTUUR", "PLATFORM_FACTUUR"]).default("KLANT_FACTUUR"),
  customerName: z.string().min(1, "Klantnaam is verplicht"),
  customerEmail: z.string().email("Ongeldig e-mailadres"),
  vatRate: z.enum(["STANDAARD", "LAAG", "VRIJGESTELD"]).default("STANDAARD"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
  items: z.array(invoiceItemSchema).min(1, "Voeg minimaal één regel toe"),
});

const VAT_PERCENTAGES = {
  STANDAARD: 0.21,
  LAAG: 0.09,
  VRIJGESTELD: 0,
} as const;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const tenantId = searchParams.get("tenantId");
  const type = searchParams.get("type");

  const where: any = {};
  if (
    status &&
    ["CONCEPT", "VERZONDEN", "BETAALD", "VERLOPEN"].includes(status)
  ) {
    where.status = status;
  }
  if (tenantId) {
    where.tenantId = tenantId;
  }
  if (type && ["KLANT_FACTUUR", "PLATFORM_FACTUUR"].includes(type)) {
    where.type = type;
  }

  const invoices = await db.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { companyName: true } },
      invoiceItems: true,
      _count: { select: { paymentReminders: true } },
    },
  });

  return success(invoices);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const {
    tenantId,
    type,
    customerName,
    customerEmail,
    vatRate,
    dueDate,
    items,
  } = parsed.data;

  // Verify tenant exists
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return error("Tenant niet gevonden");
  }

  // Generate next invoice number — different prefix for platform invoices
  const year = new Date().getFullYear();
  const prefix = type === "PLATFORM_FACTUUR" ? `AKWS-${year}-` : `AK-${year}-`;
  const lastInvoice = await db.invoice.findFirst({
    where: {
      tenantId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: "desc" },
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-");
    nextNumber = parseInt(parts[parts.length - 1], 10) + 1;
  }
  const invoiceNumber = `${prefix}${String(nextNumber).padStart(3, "0")}`;

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const vatPercentage = VAT_PERCENTAGES[vatRate];
  const vatAmount = Math.round(subtotal * vatPercentage * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  const invoice = await db.invoice.create({
    data: {
      tenantId,
      type,
      invoiceNumber,
      customerName,
      customerEmail,
      items: items as any,
      subtotal,
      vatRate,
      vatAmount,
      total,
      dueDate: new Date(dueDate),
      invoiceItems: {
        create: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: Math.round(item.quantity * item.unitPrice * 100) / 100,
        })),
      },
    },
    include: { invoiceItems: true, tenant: { select: { companyName: true } } },
  });

  return success(invoice, 201);
}
