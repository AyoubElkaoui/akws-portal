"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Send, UserPlus, Trash2 } from "lucide-react";

interface CampaignActionsProps {
  campaignId: string;
  status: string;
  recipientCount: number;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export function CampaignActions({
  campaignId,
  status,
  recipientCount,
}: CampaignActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    if (recipientDialogOpen) {
      fetch("/api/contacts")
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setContacts(result.data.filter((c: Contact) => c.email));
          }
        });
    }
  }, [recipientDialogOpen]);

  function toggleContact(id: string) {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleAddRecipients() {
    if (selectedContacts.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/email/campaigns/${campaignId}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: selectedContacts }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      toast.success(`${result.data.added} ontvanger(s) toegevoegd`);
      setRecipientDialogOpen(false);
      setSelectedContacts([]);
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!confirm("Weet je zeker dat je deze campagne wilt versturen?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/email/campaigns/${campaignId}/send`, {
        method: "POST",
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      toast.success("Campagne verstuurd naar alle ontvangers");
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Weet je zeker dat je deze campagne wilt verwijderen?"))
      return;
    setLoading(true);

    try {
      const res = await fetch(`/api/email/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      toast.success("Campagne verwijderd");
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  if (status === "VERZONDEN") return null;

  return (
    <>
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          disabled={loading || recipientCount === 0}
          onClick={handleSend}
          title={recipientCount === 0 ? "Voeg eerst ontvangers toe" : undefined}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Verstuur
        </Button>
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
            <DropdownMenuItem onClick={() => setRecipientDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Ontvangers toevoegen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={recipientDialogOpen} onOpenChange={setRecipientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ontvangers toevoegen</DialogTitle>
            <DialogDescription>
              Selecteer contacten uit je CRM om als ontvanger toe te voegen.
            </DialogDescription>
          </DialogHeader>
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Geen contacten met e-mailadres gevonden. Voeg eerst contacten toe
              in je CRM.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {contacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-slate-50"
                >
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => toggleContact(contact.id)}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{contact.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <Button
            onClick={handleAddRecipients}
            disabled={loading || selectedContacts.length === 0}
            className="w-full"
          >
            {loading
              ? "Toevoegen..."
              : `${selectedContacts.length} ontvanger(s) toevoegen`}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
