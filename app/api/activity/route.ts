import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, unauthorized } from "@/lib/api/response"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  const { searchParams } = req.nextUrl
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)

  if (user.role === "ADMIN") {
    const events = await db.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { tenant: { select: { companyName: true } } },
    })
    return success(events)
  }

  if (!user.tenantId) return unauthorized()

  const events = await db.activityEvent.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return success(events)
}
