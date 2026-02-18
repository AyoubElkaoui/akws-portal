"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";

interface FileActionsProps {
  fileId: string;
  hasShareLink: boolean;
}

export function FileActions({ fileId }: FileActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    try {
      const res = await fetch(`/api/files/${fileId}/download`);
      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      window.open(result.data.downloadUrl, "_blank");
    } catch {
      toast.error("Er is iets misgegaan");
    }
  }

  async function handleDelete() {
    if (!confirm("Weet je zeker dat je dit bestand wilt verwijderen?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/files?id=${fileId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      toast.success("Bestand verwijderd");
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-slate-600"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-red-600"
        disabled={loading}
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
