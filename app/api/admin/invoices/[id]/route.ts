import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { success, error, unauthorized, notFound } from "@/lib/api/response"

const updateInvoiceSchema = z.object({
  status: z.enum(["CONCEPT", "VERZONDEN", "BETAALD", "VERLOPEN"]).optional(),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  dueDate: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      tenant: { select: { companyName: true } },
      invoiceItems: true,
      paymentReminders: { orderBy: { sentAt: "desc" } },
    },
  })

  if (!invoice) return notFound("Factuur")

  return success(invoice)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateInvoiceSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const invoice = await db.invoice.findUnique({ where: { id } })
  if (!invoice) return notFound("Factuur")

  const updateData: any = { ...parsed.data }
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate)
  }
  if (updateData.status === "BETAALD") {
    updateData.paidAt = new Date()
  }

  const updated = await db.invoice.update({
    where: { id },
    data: updateData,
    include: {
      invoiceItems: true,
      tenant: { select: { companyName: true } },
    },
  })

  return success(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const { id } = await params

  const invoice = await db.invoice.findUnique({ where: { id } })
  if (!invoice) return notFound("Factuur")

  if (invoice.status !== "CONCEPT") {
    return error("Alleen concept-facturen kunnen worden verwijderd")
  }

  await db.invoice.delete({ where: { id } })

  return success({ deleted: true })
}
