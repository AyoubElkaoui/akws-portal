"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

interface ReviewActionsProps {
  reviewId: string;
  isTestimonial: boolean;
}

export function ReviewActions({ reviewId, isTestimonial }: ReviewActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggleTestimonial() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleTestimonial: true }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      toast.success(
        result.data.testimonial
          ? "Review wordt getoond op je website"
          : "Review verborgen van je website",
      );
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Weet je zeker dat je deze review wilt verwijderen?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      toast.success("Review verwijderd");
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1.5"
        title={
          isTestimonial ? "Zichtbaar op website" : "Niet zichtbaar op website"
        }
      >
        <span className="text-xs text-slate-400">Website</span>
        <Switch
          checked={isTestimonial}
          onCheckedChange={handleToggleTestimonial}
          disabled={loading}
          className="scale-75"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-slate-400 hover:text-red-600"
        disabled={loading}
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
