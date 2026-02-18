import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, error, unauthorized, notFound } from "@/lib/api/response";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/email/service";
import { renderInvoiceSentEmail } from "@/lib/email/templates/invoice-sent";
import { notifyTenantUsers } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { invoiceItems: true, tenant: true },
  });

  if (!invoice) return notFound("Factuur");

  if (invoice.status !== "CONCEPT") {
    return error("Alleen concept-facturen kunnen worden verstuurd");
  }

  const updated = await db.invoice.update({
    where: { id },
    data: { status: "VERZONDEN" },
  });

  const companyName = invoice.type === "PLATFORM_FACTUUR"
    ? "AK Web Solutions"
    : invoice.tenant.companyName;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  await sendEmail({
    to: invoice.customerEmail,
    subject: `Factuur ${invoice.invoiceNumber} - ${companyName}`,
    html: renderInvoiceSentEmail({
      companyName,
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
    invoice.tenantId,
    "Factuur ontvangen",
    `Factuur ${invoice.invoiceNumber} van ${companyName}`,
    `/dashboard/facturen/${id}`,
  );

  await logActivity(
    invoice.tenantId,
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
