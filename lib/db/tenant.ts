import { db } from "@/lib/db";
import { cache } from "react";

/**
 * Helper to ensure tenant scoping in where clauses.
 * Usage: db.project.findMany({ where: { ...tenantScope(tenantId), status: "ACTIEF" } })
 */
export function tenantScope(tenantId: string) {
  return { tenantId } as const;
}

/**
 * Check which modules are enabled for a tenant.
 * Cached per request using React cache().
 */
export const getTenantModules = cache(async (tenantId: string) => {
  const tenantModules = await db.tenantModule.findMany({
    where: { tenantId, enabled: true },
    include: { module: true },
  });
  return tenantModules.map((tm) => tm.module.slug);
});

/**
 * Check if a specific module is enabled for a tenant.
 */
export async function isModuleEnabled(
  tenantId: string,
  moduleSlug: string,
): Promise<boolean> {
  const modules = await getTenantModules(tenantId);
  return modules.includes(moduleSlug);
}

/**
 * Get tenant by ID with caching.
 */
export const getTenant = cache(async (tenantId: string) => {
  return db.tenant.findUnique({ where: { id: tenantId } });
});
