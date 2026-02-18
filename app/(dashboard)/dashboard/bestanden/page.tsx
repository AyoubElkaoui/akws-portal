import { redirect } from "next/navigation";
import Link from "next/link";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { tenantScope } from "@/lib/db/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileBox,
  Folder as FolderIcon,
  FileText,
  FileImage,
  File as FileGenericIcon,
  Link2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateFolderDialog } from "./create-folder-dialog";
import { UploadFileDialog } from "./upload-file-dialog";
import { FileActions } from "./file-actions";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return FileText;
  return FileGenericIcon;
}

export default async function BestandenPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "bestanden"))) {
    redirect("/dashboard");
  }

  const { folder: folderId } = await searchParams;

  // Get current folder info + breadcrumbs
  let currentFolder = null;
  const breadcrumbs: { id: string; name: string }[] = [];

  if (folderId) {
    currentFolder = await db.folder.findFirst({
      where: { id: folderId, ...tenantScope(user.tenantId) },
      include: { parent: true },
    });

    if (!currentFolder) redirect("/dashboard/bestanden");

    // Build breadcrumbs
    let folder = currentFolder as any;
    while (folder) {
      breadcrumbs.unshift({ id: folder.id, name: folder.name });
      if (folder.parentId) {
        folder = await db.folder.findFirst({
          where: { id: folder.parentId },
          include: { parent: true },
        });
      } else {
        folder = null;
      }
    }
  }

  // Fetch folders and files for current directory
  const [folders, files] = await Promise.all([
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
    db.file.findMany({
      where: {
        ...tenantScope(user.tenantId),
        folderId: folderId || null,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bestanden</h2>
          <p className="text-sm text-slate-500">
            Upload en deel bestanden veilig.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateFolderDialog parentId={folderId} />
          <UploadFileDialog folderId={folderId} />
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/dashboard/bestanden"
            className="text-blue-600 hover:underline"
          >
            Bestanden
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <span className="text-slate-400">/</span>
              <Link
                href={`/dashboard/bestanden?folder=${crumb.id}`}
                className="text-blue-600 hover:underline"
              >
                {crumb.name}
              </Link>
            </span>
          ))}
        </div>
      )}

      {/* Back button in subfolder */}
      {currentFolder && currentFolder.parentId !== null && (
        <Link href={`/dashboard/bestanden?folder=${currentFolder.parentId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
        </Link>
      )}
      {currentFolder && currentFolder.parentId === null && (
        <Link href="/dashboard/bestanden">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
        </Link>
      )}

      {/* Content */}
      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileBox className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 text-center">
              {folderId
                ? "Deze map is leeg. Upload een bestand of maak een submap aan."
                : "Je hebt nog geen bestanden. Upload je eerste bestand."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Grootte</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Folders first */}
                {folders.map((folder) => (
                  <TableRow key={folder.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/bestanden?folder=${folder.id}`}
                        className="flex items-center gap-2 font-medium text-slate-900 hover:text-blue-600"
                      >
                        <FolderIcon className="h-4 w-4 text-amber-500" />
                        {folder.name}
                        <span className="text-xs text-slate-400">
                          ({folder._count.files} bestanden,{" "}
                          {folder._count.children} mappen)
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-400">—</TableCell>
                    <TableCell className="text-slate-400">—</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
                {/* Files */}
                {files.map((file) => {
                  const Icon = getFileIcon(file.mimeType);

                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {file.name}
                          </span>
                          {file.shareLink && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-600 text-xs"
                            >
                              <Link2 className="mr-1 h-3 w-3" />
                              Gedeeld
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatSize(file.size)}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(file.createdAt)}
                      </TableCell>
                      <TableCell>
                        <FileActions
                          fileId={file.id}
                          hasShareLink={!!file.shareLink}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
