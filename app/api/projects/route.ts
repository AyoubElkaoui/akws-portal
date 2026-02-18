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

  const projects = await db.project.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          milestones: true,
          revisions: true,
        },
      },
      milestones: {
        select: { id: true, completed: true },
      },
    },
  })

  const data = projects.map((project) => {
    const completedMilestones = project.milestones.filter(
      (m) => m.completed,
    ).length

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      milestonesTotal: project._count.milestones,
      milestonesCompleted: completedMilestones,
      revisionsCount: project._count.revisions,
    }
  })

  return success(data)
}
