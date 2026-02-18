import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { tenantScope } from "@/lib/db/tenant";
import { success, error, unauthorized, notFound } from "@/lib/api/response";

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
});

const updateInvoiceSchema = z.object({
  status: z.enum(["CONCEPT", "VERZONDEN", "BETAALD", "VERLOPEN"]).optional(),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  dueDate: z.string().optional(),
  vatRate: z.enum(["STANDAARD", "LAAG", "VRIJGESTELD"]).optional(),
  items: z.array(invoiceItemSchema).optional(),
});

export async function GET(
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

  const invoice = await db.invoice.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
    include: {
      invoiceItems: true,
      paymentReminders: { orderBy: { sentAt: "desc" } },
    },
  });

  if (!invoice) return notFound("Factuur");

  return success(invoice);
}

export async function PATCH(
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
  const body = await req.json();
  const parsed = updateInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const invoice = await db.invoice.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  });

  if (!invoice) return notFound("Factuur");

  const { items, ...rest } = parsed.data;
  const updateData: any = { ...rest };
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate);
  }
  if (updateData.status === "BETAALD") {
    updateData.paidAt = new Date();
  }

  if (items && invoice.status !== "CONCEPT") {
    return error(
      "Factuurregels kunnen alleen bij concept-facturen worden gewijzigd",
    );
  }

  const updated = await db.$transaction(async (tx) => {
    if (items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      const vatRateValue = updateData.vatRate || invoice.vatRate;
      const vatMultiplier =
        vatRateValue === "STANDAARD"
          ? 0.21
          : vatRateValue === "LAAG"
            ? 0.09
            : 0;

      const newItems = items.map((item, index) => ({
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        sortOrder: index,
      }));

      await tx.invoiceItem.createMany({ data: newItems });

      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const vatAmount = Math.round(subtotal * vatMultiplier * 100) / 100;
      const total = subtotal + vatAmount;

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.total = total;
    }

    return tx.invoice.update({
      where: { id },
      data: updateData,
      include: { invoiceItems: true },
    });
  });

  return success(updated);
}

export async function DELETE(
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

  const invoice = await db.invoice.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
  });

  if (!invoice) return notFound("Factuur");

  // Only allow deleting CONCEPT invoices
  if (invoice.status !== "CONCEPT") {
    return error("Alleen concept-facturen kunnen worden verwijderd");
  }

  await db.invoice.delete({ where: { id } });

  return success({ deleted: true });
}
