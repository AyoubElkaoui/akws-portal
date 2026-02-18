import { db } from "@/lib/db"

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string,
) {
  return db.notification.create({
    data: { userId, title, message, link },
  })
}

export async function notifyTenantUsers(
  tenantId: string,
  title: string,
  message: string,
  link?: string,
) {
  const users = await db.user.findMany({
    where: { tenantId },
    select: { id: true },
  })

  if (users.length === 0) return

  return db.notification.createMany({
    data: users.map((u) => ({ userId: u.id, title, message, link })),
  })
}

export async function notifyAdmins(
  title: string,
  message: string,
  link?: string,
) {
  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  })

  if (admins.length === 0) return

  return db.notification.createMany({
    data: admins.map((u) => ({ userId: u.id, title, message, link })),
  })
}
