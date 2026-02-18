import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { tenantScope } from "@/lib/db/tenant";
import { success, unauthorized } from "@/lib/api/response";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const { searchParams } = req.nextUrl;
  const days = Math.min(parseInt(searchParams.get("days") || "7"), 30);

  const checks = await db.uptimeCheck.findMany({
    where: {
      ...tenantScope(user.tenantId),
      checkedAt: { gte: subDays(new Date(), days) },
    },
    orderBy: { checkedAt: "asc" },
  });

  return success(checks);
}
