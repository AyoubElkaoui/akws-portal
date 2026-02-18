import { NextRequest } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, error, unauthorized } from "@/lib/api/response";
import { MODULE_DEFINITIONS } from "@/types";

const createTenantSchema = z.object({
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht"),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Ongeldige slug"),
  plan: z.enum(["STARTER", "BUSINESS", "PREMIUM"]),
  domain: z.string().optional(),
  userName: z.string().min(1, "Naam is verplicht"),
  userEmail: z.string().email("Ongeldig e-mailadres"),
  userPassword: z.string().min(8, "Wachtwoord moet minimaal 8 tekens zijn"),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const tenants = await db.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, projects: true, invoices: true } },
    },
  });

  return success(tenants);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await req.json();
  const parsed = createTenantSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const { companyName, slug, plan, domain, userName, userEmail, userPassword } =
    parsed.data;

  // Check if slug or email already exists
  const existingSlug = await db.tenant.findUnique({ where: { slug } });
  if (existingSlug) {
    return error("Deze slug is al in gebruik");
  }

  const existingEmail = await db.user.findUnique({
    where: { email: userEmail },
  });
  if (existingEmail) {
    return error("Dit e-mailadres is al in gebruik");
  }

  // Ensure modules exist in the database
  for (const mod of MODULE_DEFINITIONS) {
    await db.module.upsert({
      where: { slug: mod.slug },
      update: {},
      create: {
        name: mod.name,
        slug: mod.slug,
        description: mod.description,
        icon: mod.icon,
      },
    });
  }

  // Create tenant, user, and enable modules in a transaction
  const tenant = await db.$transaction(async (tx) => {
    const newTenant = await tx.tenant.create({
      data: {
        companyName,
        slug,
        plan,
        domain: domain || null,
      },
    });

    const hashedPassword = await hash(userPassword, 12);
    await tx.user.create({
      data: {
        name: userName,
        email: userEmail,
        password: hashedPassword,
        role: "CLIENT",
        tenantId: newTenant.id,
      },
    });

    // Enable modules based on plan
    const allModules = await tx.module.findMany();
    const modulesToEnable = MODULE_DEFINITIONS.filter((m) =>
      m.plans.includes(plan),
    ).map((m) => m.slug);

    for (const mod of allModules) {
      await tx.tenantModule.create({
        data: {
          tenantId: newTenant.id,
          moduleId: mod.id,
          enabled: modulesToEnable.includes(mod.slug),
        },
      });
    }

    // Auto-create WebsiteStatus if domain is provided
    if (domain) {
      await tx.websiteStatus.create({
        data: {
          tenantId: newTenant.id,
          url: domain,
          uptimePercent: 100,
          isOnline: true,
          lastCheck: new Date(),
        },
      });
    }

    return newTenant;
  });

  return success(tenant, 201);
}
