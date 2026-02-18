import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/api/auth";
import { tenantScope } from "@/lib/db/tenant";
import { success, error, unauthorized } from "@/lib/api/response";
import { deleteFromR2 } from "@/lib/storage/r2";

const createFileSchema = z.object({
  name: z.string().min(1, "Bestandsnaam is verplicht"),
  key: z.string().min(1, "Bestandssleutel is verplicht"),
  size: z.number().min(0),
  mimeType: z.string().min(1),
  folderId: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const searchParams = req.nextUrl.searchParams;
  const folderId = searchParams.get("folderId");

  const where: any = {
    ...tenantScope(user.tenantId),
    folderId: folderId || null,
  };

  const [files, folders] = await Promise.all([
    db.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    db.folder.findMany({
      where: {
        ...tenantScope(user.tenantId),
        parentId: folderId || null,
      },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { files: true, children: true } },
      },
    }),
  ]);

  return success({ files, folders });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const body = await req.json();
  const parsed = createFileSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const { name, key, size, mimeType, folderId } = parsed.data;

  // Verify folder belongs to tenant if provided
  if (folderId) {
    const folder = await db.folder.findFirst({
      where: { id: folderId, ...tenantScope(user.tenantId) },
    });
    if (!folder) {
      return error("Map niet gevonden");
    }
  }

  const file = await db.file.create({
    data: {
      tenantId: user.tenantId,
      name,
      key,
      size,
      mimeType,
      folderId: folderId || null,
    },
  });

  return success(file, 201);
}

export async function DELETE(req: NextRequest) {
  let user;
  try {
    user = await requireTenant();
  } catch {
    return unauthorized();
  }

  const searchParams = req.nextUrl.searchParams;
  const fileId = searchParams.get("id");

  if (!fileId) {
    return error("Bestands-ID is verplicht");
  }

  const file = await db.file.findFirst({
    where: { id: fileId, ...tenantScope(user.tenantId) },
  });

  if (!file) {
    return error("Bestand niet gevonden", 404);
  }

  await deleteFromR2(file.key);
  await db.file.delete({ where: { id: fileId } });

  return success({ deleted: true });
}
