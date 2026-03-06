import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { success, error } from "@/lib/api/response"
import { notifyTenantUsers } from "@/lib/notifications"
import * as tls from "tls"

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function checkWebsite(url: string): Promise<{
  isOnline: boolean
  loadTime: number | null
  sslExpiry: Date | null
}> {
  let isOnline = false
  let loadTime: number | null = null
  let sslExpiry: Date | null = null

  // Ensure URL has protocol
  const fullUrl = url.startsWith("http") ? url : `https://${url}`

  // Measure load time with HTTP fetch
  try {
    const start = performance.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(fullUrl, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    })

    clearTimeout(timeout)
    const end = performance.now()

    isOnline = res.ok || res.status < 500
    loadTime = Math.round((end - start) / 100) / 10 // seconds, 1 decimal
  } catch {
    isOnline = false
    loadTime = null
  }

  // Check SSL certificate expiry
  try {
    const hostname = fullUrl.replace(/^https?:\/\//, "").split("/")[0].split(":")[0]
    sslExpiry = await getSslExpiry(hostname)
  } catch {
    sslExpiry = null
  }

  return { isOnline, loadTime, sslExpiry }
}

function getSslExpiry(hostname: string): Promise<Date | null> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host: hostname,
          port: 443,
          servername: hostname,
          timeout: 10000,
        },
        () => {
          try {
            const cert = socket.getPeerCertificate()
            socket.destroy()
            if (cert && cert.valid_to) {
              resolve(new Date(cert.valid_to))
            } else {
              resolve(null)
            }
          } catch {
            socket.destroy()
            resolve(null)
          }
        },
      )

      socket.on("error", () => {
        socket.destroy()
        resolve(null)
      })

      socket.on("timeout", () => {
        socket.destroy()
        resolve(null)
      })
    } catch {
      resolve(null)
    }
  })
}

export async function GET(req: NextRequest) {
  // Auth check
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return error("Niet geautoriseerd", 401)
    }
  }

  try {
    // Get all websites to check
    const websites = await db.websiteStatus.findMany({
      include: { tenant: { select: { id: true, companyName: true, active: true } } },
    })

    const activeWebsites = websites.filter((ws) => ws.tenant.active)

    if (activeWebsites.length === 0) {
      return success({ checked: 0, message: "Geen actieve websites om te checken" })
    }

    let checked = 0
    let alertsCreated = 0

    for (const ws of activeWebsites) {
      const result = await checkWebsite(ws.url)

      // Calculate new uptime percentage based on recent checks
      const recentChecks = await db.uptimeCheck.findMany({
        where: { tenantId: ws.tenantId },
        orderBy: { checkedAt: "desc" },
        take: 99, // Last 99 + this one = 100 checks
      })

      const totalChecks = recentChecks.length + 1
      const onlineChecks = recentChecks.filter((c) => c.isOnline).length + (result.isOnline ? 1 : 0)
      const uptimePercent = Math.round((onlineChecks / totalChecks) * 1000) / 10

      // Update WebsiteStatus
      await db.websiteStatus.update({
        where: { id: ws.id },
        data: {
          isOnline: result.isOnline,
          loadTime: result.loadTime,
          sslExpiry: result.sslExpiry,
          uptimePercent,
          lastCheck: new Date(),
        },
      })

      // Create UptimeCheck record
      await db.uptimeCheck.create({
        data: {
          tenantId: ws.tenantId,
          isOnline: result.isOnline,
          loadTime: result.loadTime,
        },
      })

      // Create alerts for status changes
      const wasOnline = ws.isOnline

      if (wasOnline && !result.isOnline) {
        // Website went down
        await db.websiteAlert.create({
          data: {
            tenantId: ws.tenantId,
            type: "DOWN",
            message: `Website ${ws.url} is offline.`,
          },
        })
        await notifyTenantUsers(
          ws.tenantId,
          "Website offline",
          `Je website ${ws.url} is niet bereikbaar.`,
          "/dashboard/website",
        )
        alertsCreated++
      }

      if (!wasOnline && result.isOnline) {
        // Website came back up
        await db.websiteAlert.create({
          data: {
            tenantId: ws.tenantId,
            type: "UP",
            message: `Website ${ws.url} is weer online.`,
          },
        })
        // Resolve open DOWN alerts
        await db.websiteAlert.updateMany({
          where: {
            tenantId: ws.tenantId,
            type: "DOWN",
            resolvedAt: null,
          },
          data: { resolvedAt: new Date() },
        })
        alertsCreated++
      }

      // SSL expiry warning (< 14 days)
      if (result.sslExpiry) {
        const daysLeft = Math.floor(
          (result.sslExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )

        if (daysLeft > 0 && daysLeft <= 14) {
          // Check if we already alerted recently
          const recentSslAlert = await db.websiteAlert.findFirst({
            where: {
              tenantId: ws.tenantId,
              type: "SSL_EXPIRING",
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          })

          if (!recentSslAlert) {
            await db.websiteAlert.create({
              data: {
                tenantId: ws.tenantId,
                type: "SSL_EXPIRING",
                message: `SSL certificaat voor ${ws.url} verloopt over ${daysLeft} dagen.`,
              },
            })
            await notifyTenantUsers(
              ws.tenantId,
              "SSL certificaat verloopt",
              `Het SSL certificaat voor ${ws.url} verloopt over ${daysLeft} dagen.`,
              "/dashboard/website",
            )
            alertsCreated++
          }
        }
      }

      // Slow response alert (> 5 seconds)
      if (result.loadTime && result.loadTime > 5) {
        const recentSlowAlert = await db.websiteAlert.findFirst({
          where: {
            tenantId: ws.tenantId,
            type: "SLOW",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        })

        if (!recentSlowAlert) {
          await db.websiteAlert.create({
            data: {
              tenantId: ws.tenantId,
              type: "SLOW",
              message: `Website ${ws.url} laadt traag (${result.loadTime.toFixed(1)}s).`,
            },
          })
          alertsCreated++
        }
      }

      checked++
    }

    return success({
      checked,
      alertsCreated,
      message: `${checked} websites gecheckt, ${alertsCreated} alerts aangemaakt`,
    })
  } catch (err) {
    console.error("[Cron] Fout bij uptime check:", err)
    return error("Fout bij uptime check", 500)
  }
}
