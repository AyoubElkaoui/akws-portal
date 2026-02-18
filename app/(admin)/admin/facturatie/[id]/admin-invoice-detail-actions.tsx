"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Send,
  Bell,
  CheckCircle,
  Trash2,
  XCircle,
  FileText,
} from "lucide-react";

interface AdminInvoiceDetailActionsProps {
  invoiceId: string;
  status: string;
}

export function AdminInvoiceDetailActions({
  invoiceId,
  status,
}: AdminInvoiceDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    if (action === "delete") {
      if (!confirm("Weet je zeker dat je deze factuur wilt verwijderen?"))
        return;
    }
    setLoading(true);
    try {
      let res: Response;

      switch (action) {
        case "send":
          res = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
            method: "POST",
          });
          break;
        case "remind":
          res = await fetch(`/api/admin/invoices/${invoiceId}/remind`, {
            method: "POST",
          });
          break;
        case "markPaid":
          res = await fetch(`/api/admin/invoices/${invoiceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "BETAALD" }),
          });
          break;
        case "markOverdue":
          res = await fetch(`/api/admin/invoices/${invoiceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "VERLOPEN" }),
          });
          break;
        case "delete":
          res = await fetch(`/api/admin/invoices/${invoiceId}`, {
            method: "DELETE",
          });
          break;
        default:
          return;
      }

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      const messages: Record<string, string> = {
        send: "Factuur verstuurd per e-mail",
        remind: "Betalingsherinnering verstuurd",
        markPaid: "Factuur gemarkeerd als betaald",
        markOverdue: "Factuur gemarkeerd als verlopen",
        delete: "Factuur verwijderd",
      };

      toast.success(messages[action]);

      if (action === "delete") {
        router.push("/admin/facturatie");
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/admin/facturatie/${invoiceId}/pdf`}>
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          PDF
        </Link>
      </Button>
      {status === "CONCEPT" && (
        <Button
          size="sm"
          disabled={loading}
          onClick={() => handleAction("send")}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Versturen
        </Button>
      )}
      {(status === "VERZONDEN" || status === "VERLOPEN") && (
        <Button
          size="sm"
          disabled={loading}
          onClick={() => handleAction("markPaid")}
        >
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          Markeer als betaald
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(status === "VERZONDEN" || status === "VERLOPEN") && (
            <DropdownMenuItem onClick={() => handleAction("remind")}>
              <Bell className="mr-2 h-4 w-4" />
              Herinnering sturen
            </DropdownMenuItem>
          )}
          {status === "VERZONDEN" && (
            <DropdownMenuItem onClick={() => handleAction("markOverdue")}>
              <XCircle className="mr-2 h-4 w-4" />
              Markeer als verlopen
            </DropdownMenuItem>
          )}
          {status === "CONCEPT" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleAction("delete")}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Verwijderen
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
