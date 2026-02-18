import { auth } from "@/lib/auth"
import type { SessionUser } from "@/types"

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
    role: session.user.role,
    tenantId: session.user.tenantId,
    avatar: session.user.avatar,
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Niet ingelogd")
  }
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== "ADMIN") {
    throw new Error("Geen toegang")
  }
  return user
}

export async function requireTenant(): Promise<SessionUser & { tenantId: string }> {
  const user = await requireAuth()
  if (!user.tenantId) {
    throw new Error("Geen tenant gekoppeld")
  }
  return user as SessionUser & { tenantId: string }
}
