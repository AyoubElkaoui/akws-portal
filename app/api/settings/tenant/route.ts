import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { success, error, unauthorized } from "@/lib/api/response";

const MAX_LOGO_SIZE = 300_000; // ~200KB file → ~270KB base64

const updateTenantSchema = z.object({
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht").optional(),
  domain: z.string().optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  logo: z
    .string()
    .max(MAX_LOGO_SIZE, "Logo is te groot (max 200KB)")
    .optional()
    .nullable(),
  address: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  kvkNumber: z.string().optional().or(z.literal("")),
  btwNumber: z.string().optional().or(z.literal("")),
  iban: z.string().optional().or(z.literal("")),
  bic: z.string().optional().or(z.literal("")),
});

export async function GET() {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      companyName: true,
      slug: true,
      domain: true,
      plan: true,
      primaryColor: true,
      logo: true,
      address: true,
      postalCode: true,
      city: true,
      phone: true,
      email: true,
      kvkNumber: true,
      btwNumber: true,
      iban: true,
      bic: true,
    },
  });

  return success(tenant);
}

export async function PATCH(req: NextRequest) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const body = await req.json();
  const parsed = updateTenantSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const updateData: any = {};
  if (parsed.data.companyName) updateData.companyName = parsed.data.companyName;
  if (parsed.data.domain !== undefined)
    updateData.domain = parsed.data.domain || null;
  if (parsed.data.primaryColor)
    updateData.primaryColor = parsed.data.primaryColor;
  if (parsed.data.logo !== undefined) updateData.logo = parsed.data.logo;

  // Business fields
  const optionalFields = ["address", "postalCode", "city", "phone", "email", "kvkNumber", "btwNumber", "iban", "bic"] as const;
  for (const field of optionalFields) {
    if (parsed.data[field] !== undefined) {
      updateData[field] = parsed.data[field] || null;
    }
  }

  const updated = await db.tenant.update({
    where: { id: user.tenantId },
    data: updateData,
  });

  return success(updated);
}
