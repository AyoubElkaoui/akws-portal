import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { success, error, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  content: z.string().min(1, "Inhoud is verplicht"),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const responses = await db.cannedResponse.findMany({
    orderBy: { title: "asc" },
  });

  return success(responses);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const response = await db.cannedResponse.create({
    data: parsed.data,
  });

  return success(response, 201);
}
