import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, error, unauthorized, notFound } from "@/lib/api/response";
import { MODULE_DEFINITIONS } from "@/types";

const updateTenantSchema = z.object({
  companyName: z.string().min(1).optional(),
  plan: z.enum(["STARTER", "BUSINESS", "PREMIUM"]).optional(),
  domain: z.string().optional(),
  active: z.boolean().optional(),
  primaryColor: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true, email: true, role: true } },
      tenantModules: { include: { module: true } },
      _count: { select: { projects: true, invoices: true, tickets: true } },
    },
  });

  if (!tenant) return notFound("Klant");

  return success(tenant);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTenantSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const tenant = await db.tenant.findUnique({ where: { id } });
  if (!tenant) return notFound("Klant");

  const updated = await db.tenant.update({
    where: { id },
    data: parsed.data,
  });

  // If domain changed, create or update WebsiteStatus
  if (
    parsed.data.domain !== undefined &&
    parsed.data.domain !== tenant.domain
  ) {
    const existingWebsite = await db.websiteStatus.findFirst({
      where: { tenantId: id },
    });

    if (parsed.data.domain) {
      if (existingWebsite) {
        await db.websiteStatus.update({
          where: { id: existingWebsite.id },
          data: { url: parsed.data.domain, lastCheck: new Date() },
        });
      } else {
        await db.websiteStatus.create({
          data: {
            tenantId: id,
            url: parsed.data.domain,
            uptimePercent: 100,
            isOnline: true,
            lastCheck: new Date(),
          },
        });
      }
    }
  }

  // If plan changed, update module availability
  if (parsed.data.plan && parsed.data.plan !== tenant.plan) {
    const modulesToEnable = MODULE_DEFINITIONS.filter((m) =>
      m.plans.includes(parsed.data.plan!),
    ).map((m) => m.slug);

    const allModules = await db.module.findMany();
    for (const mod of allModules) {
      await db.tenantModule.updateMany({
        where: { tenantId: id, moduleId: mod.id },
        data: { enabled: modulesToEnable.includes(mod.slug) },
      });
    }
  }

  return success(updated);
}
