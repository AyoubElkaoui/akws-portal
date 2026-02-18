"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, File as FileIcon, X } from "lucide-react";

interface UploadFileDialogProps {
  folderId?: string | null;
}

export function UploadFileDialog({ folderId }: UploadFileDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setLoading(true);
    setProgress(0);

    try {
      // Step 1: Get presigned upload URL from R2
      setProgress(10);
      const urlRes = await fetch("/api/files/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          size: selectedFile.size,
        }),
      });

      const urlResult = await urlRes.json();

      if (!urlResult.success) {
        toast.error(urlResult.error || "Er is iets misgegaan");
        return;
      }

      const { uploadUrl, key } = urlResult.data;

      // Step 2: Upload file directly to R2 via presigned URL
      setProgress(30);
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        toast.error("Upload naar opslag mislukt");
        return;
      }

      // Step 3: Create file record in database
      setProgress(80);
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          key,
          size: selectedFile.size,
          mimeType: selectedFile.type || "application/octet-stream",
          folderId: folderId || null,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      setProgress(100);
      toast.success("Bestand succesvol geupload");
      setOpen(false);
      setSelectedFile(null);
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelectedFile(null);
          setProgress(0);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Uploaden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bestand uploaden</DialogTitle>
          <DialogDescription>
            Selecteer een bestand om te uploaden (max. 50 MB).
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />

        {!selectedFile ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-8 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <Upload className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Klik om een bestand te selecteren
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Max. 50 MB per bestand
            </p>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <FileIcon className="h-8 w-8 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatSize(selectedFile.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {loading && (
          <div className="w-full">
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-center">
              {progress < 30
                ? "Voorbereiden..."
                : progress < 80
                  ? "Bestand uploaden..."
                  : progress < 100
                    ? "Afronden..."
                    : "Voltooid!"}
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          className="w-full"
          disabled={loading || !selectedFile}
        >
          {loading ? "Bezig met uploaden..." : "Uploaden"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
