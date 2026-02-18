"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle, Trash2 } from "lucide-react";

interface AppointmentActionsProps {
  appointmentId: string;
  status: string;
}

export function AppointmentActions({
  appointmentId,
  status,
}: AppointmentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    if (action === "delete") {
      if (!confirm("Weet je zeker dat je deze afspraak wilt verwijderen?"))
        return;
    }
    setLoading(true);
    try {
      let res: Response;

      if (action === "delete") {
        res = await fetch(`/api/appointments/${appointmentId}`, {
          method: "DELETE",
        });
      } else {
        res = await fetch(`/api/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        });
      }

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      const messages: Record<string, string> = {
        AFGEROND: "Afspraak afgerond",
        GEANNULEERD: "Afspraak geannuleerd",
        delete: "Afspraak verwijderd",
      };

      toast.success(messages[action]);
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {status === "BEVESTIGD" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleAction("AFGEROND")}
        >
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          Afgerond
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={loading}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === "BEVESTIGD" && (
            <DropdownMenuItem onClick={() => handleAction("GEANNULEERD")}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuleren
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleAction("delete")}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
