import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, error, unauthorized } from "@/lib/api/response";

const toggleModuleSchema = z.object({
  moduleId: z.string().min(1),
  enabled: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id: tenantId } = await params;
  const body = await req.json();
  const parsed = toggleModuleSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const { moduleId, enabled } = parsed.data;

  await db.tenantModule.updateMany({
    where: { tenantId, moduleId },
    data: { enabled },
  });

  return success({ tenantId, moduleId, enabled });
}
