import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { tenantScope } from "@/lib/db/tenant";
import { success, unauthorized } from "@/lib/api/response";

export async function GET() {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const alerts = await db.websiteAlert.findMany({
    where: tenantScope(user.tenantId),
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return success(alerts);
}
