import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { tenantScope, getTenant } from "@/lib/db/tenant";
import { success, error, unauthorized, notFound } from "@/lib/api/response";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/email/service";
import { renderInvoiceSentEmail } from "@/lib/email/templates/invoice-sent";
import { notifyTenantUsers } from "@/lib/notifications";

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

  const invoice = await db.invoice.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
    include: { invoiceItems: true },
  });

  if (!invoice) return notFound("Factuur");

  if (invoice.status !== "CONCEPT") {
    return error("Alleen concept-facturen kunnen worden verstuurd");
  }

  const updated = await db.invoice.update({
    where: { id },
    data: { status: "VERZONDEN" },
  });

  const tenant = await getTenant(user.tenantId);
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  await sendEmail({
    to: invoice.customerEmail,
    subject: `Factuur ${invoice.invoiceNumber} - ${tenant?.companyName || ""}`,
    html: renderInvoiceSentEmail({
      companyName: tenant?.companyName || "",
      customerName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      dueDate: invoice.dueDate,
      items: invoice.invoiceItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      vatRate: invoice.vatRate,
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      paymentUrl: `${baseUrl}/betaal/${id}`,
    }),
  });

  await notifyTenantUsers(
    user.tenantId,
    "Factuur verstuurd",
    `Factuur ${invoice.invoiceNumber} is verstuurd naar ${invoice.customerName}`,
    `/dashboard/facturen/${id}`,
  );

  await logActivity(
    user.tenantId,
    "INVOICE_SENT",
    `Factuur ${invoice.invoiceNumber} verstuurd`,
    {
      message: `€${invoice.total.toFixed(2)} aan ${invoice.customerName}`,
      link: `/dashboard/facturen`,
      metadata: { invoiceId: id, invoiceNumber: invoice.invoiceNumber },
    },
  );

  return success(updated);
}
