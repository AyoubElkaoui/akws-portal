import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, error, unauthorized, notFound } from "@/lib/api/response";
import { logActivity } from "@/lib/activity";

const createMilestoneSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  dueDate: z.string().optional(),
});

const updateMilestoneSchema = z.object({
  milestoneId: z.string().min(1),
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return notFound("Project");

  const body = await req.json();
  const parsed = createMilestoneSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const milestone = await db.milestone.create({
    data: {
      projectId: id,
      title: parsed.data.title,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  return success(milestone, 201);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await req.json();
  const parsed = updateMilestoneSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const milestone = await db.milestone.findUnique({
    where: { id: parsed.data.milestoneId },
    include: { project: { select: { tenantId: true, name: true } } },
  });
  if (!milestone) return notFound("Milestone");

  const updateData: any = {};
  if (parsed.data.completed !== undefined)
    updateData.completed = parsed.data.completed;
  if (parsed.data.title) updateData.title = parsed.data.title;

  const updated = await db.milestone.update({
    where: { id: parsed.data.milestoneId },
    data: updateData,
  });

  if (parsed.data.completed && !milestone.completed) {
    await logActivity(
      milestone.project.tenantId,
      "MILESTONE_COMPLETED",
      `Milestone "${milestone.title}" afgerond`,
      {
        message: milestone.project.name,
        link: `/dashboard/projecten/${milestone.projectId}`,
        metadata: {
          projectId: milestone.projectId,
          milestoneId: milestone.id,
        },
      },
    );
  }

  return success(updated);
}
