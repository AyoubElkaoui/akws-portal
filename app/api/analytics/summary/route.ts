import { db } from "@/lib/db"
import { requireTenant } from "@/lib/api/auth"
import { tenantScope } from "@/lib/db/tenant"
import { success, unauthorized } from "@/lib/api/response"

export async function GET() {
  let user
  try {
    user = await requireTenant()
  } catch {
    return unauthorized()
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get page views
  const [todayViews, weekViews, monthViews] = await Promise.all([
    db.pageView.count({
      where: { ...tenantScope(user.tenantId), createdAt: { gte: today } },
    }),
    db.pageView.count({
      where: { ...tenantScope(user.tenantId), createdAt: { gte: weekAgo } },
    }),
    db.pageView.count({
      where: { ...tenantScope(user.tenantId), createdAt: { gte: monthAgo } },
    }),
  ])

  // Get summaries for last 30 days
  const summaries = await db.analyticsSummary.findMany({
    where: {
      ...tenantScope(user.tenantId),
      date: { gte: monthAgo },
    },
    orderBy: { date: "asc" },
  })

  // Get top pages (last 30 days)
  const topPages = await db.pageView.groupBy({
    by: ["page"],
    where: { ...tenantScope(user.tenantId), createdAt: { gte: monthAgo } },
    _count: { page: true },
    orderBy: { _count: { page: "desc" } },
    take: 10,
  })

  // Get top referrers
  const topReferrers = await db.pageView.groupBy({
    by: ["referrer"],
    where: {
      ...tenantScope(user.tenantId),
      createdAt: { gte: monthAgo },
      referrer: { not: null },
    },
    _count: { referrer: true },
    orderBy: { _count: { referrer: "desc" } },
    take: 10,
  })

  // Get devices
  const devices = await db.pageView.groupBy({
    by: ["device"],
    where: {
      ...tenantScope(user.tenantId),
      createdAt: { gte: monthAgo },
      device: { not: null },
    },
    _count: { device: true },
    orderBy: { _count: { device: "desc" } },
  })

  return success({
    today: todayViews,
    week: weekViews,
    month: monthViews,
    summaries,
    topPages: topPages.map((p) => ({ page: p.page, count: p._count.page })),
    topReferrers: topReferrers.map((r) => ({ referrer: r.referrer, count: r._count.referrer })),
    devices: devices.map((d) => ({ device: d.device, count: d._count.device })),
  })
}
