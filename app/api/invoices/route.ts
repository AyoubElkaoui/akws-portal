import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, error, unauthorized } from "@/lib/api/response"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  quantity: z.number().min(0.01, "Aantal moet groter dan 0 zijn"),
  unitPrice: z.number().min(0, "Prijs moet 0 of hoger zijn"),
})

const createInvoiceSchema = z.object({
  customerName: z.string().min(1, "Klantnaam is verplicht"),
  customerEmail: z.string().email("Ongeldig e-mailadres"),
  vatRate: z.enum(["STANDAARD", "LAAG", "VRIJGESTELD"]).default("STANDAARD"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
  items: z.array(invoiceItemSchema).min(1, "Voeg minimaal één regel toe"),
})

const VAT_PERCENTAGES = {
  STANDAARD: 0.21,
  LAAG: 0.09,
  VRIJGESTELD: 0,
} as const

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get("status")

  const where: any = { ...tenantScope(user.tenantId) }
  if (status && ["CONCEPT", "VERZONDEN", "BETAALD", "VERLOPEN"].includes(status)) {
    where.status = status
  }

  const invoices = await db.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      invoiceItems: true,
      _count: { select: { paymentReminders: true } },
    },
  })

  return success(invoices)
}

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = createInvoiceSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const { customerName, customerEmail, vatRate, dueDate, items } = parsed.data

  // Generate next invoice number
  const year = new Date().getFullYear()
  const lastInvoice = await db.invoice.findFirst({
    where: {
      ...tenantScope(user.tenantId),
      invoiceNumber: { startsWith: `AK-${year}-` },
    },
    orderBy: { invoiceNumber: "desc" },
  })

  let nextNumber = 1
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-")
    nextNumber = parseInt(parts[2], 10) + 1
  }
  const invoiceNumber = `AK-${year}-${String(nextNumber).padStart(3, "0")}`

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const vatPercentage = VAT_PERCENTAGES[vatRate]
  const vatAmount = Math.round(subtotal * vatPercentage * 100) / 100
  const total = Math.round((subtotal + vatAmount) * 100) / 100

  const invoice = await db.invoice.create({
    data: {
      tenantId: user.tenantId,
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
    include: { invoiceItems: true },
  })

  return success(invoice, 201)
}
