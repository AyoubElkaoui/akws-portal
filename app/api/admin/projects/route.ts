import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/api/auth"
import { success, error, unauthorized } from "@/lib/api/response"

const createProjectSchema = z.object({
  tenantId: z.string().min(1, "Tenant is verplicht"),
  name: z.string().min(1, "Projectnaam is verplicht"),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["OFFERTE", "ACTIEF", "AFGEROND", "GEPAUZEERD"]).default("OFFERTE"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const tenantId = req.nextUrl.searchParams.get("tenantId")

  const where: any = {}
  if (tenantId) where.tenantId = tenantId

  const projects = await db.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { companyName: true } },
      _count: { select: { milestones: true, revisions: true } },
    },
  })

  return success(projects)
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorized()
  }

  const body = await req.json()
  const parsed = createProjectSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0].message)
  }

  const project = await db.project.create({
    data: {
      tenantId: parsed.data.tenantId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      status: parsed.data.status,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  })

  return success(project, 201)
}
