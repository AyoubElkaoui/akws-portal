import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api/auth"
import { success, unauthorized } from "@/lib/api/response"

export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorized()
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return success(notifications)
}

export async function PATCH(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorized()
  }

  const body = await req.json()

  if (body.markAllRead) {
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    })
    return success({ marked: true })
  }

  if (body.id) {
    await db.notification.updateMany({
      where: { id: body.id, userId: user.id },
      data: { read: true },
    })
    return success({ marked: true })
  }

  return success({ marked: false })
}
