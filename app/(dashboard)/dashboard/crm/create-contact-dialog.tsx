"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

export function CreateContactDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/contacts/tags")
        .then((res) => res.json())
        .then((result) => {
          if (result.success) setTags(result.data);
        });
    }
  }, [open]);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      notes: formData.get("notes") as string,
      tagIds: selectedTags,
    };

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan");
        return;
      }

      toast.success("Contact succesvol aangemaakt");
      setOpen(false);
      setSelectedTags([]);
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuw contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuw contact toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een nieuw contact toe aan je CRM.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Jan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Jansen"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jan@voorbeeld.nl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefoonnummer</Label>
            <Input id="phone" name="phone" placeholder="06-12345678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Bedrijf</Label>
            <Input id="company" name="company" placeholder="Bedrijfsnaam" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notitie</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Optionele notitie..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            {tags.length === 0 ? (
              <p className="text-xs text-slate-500">
                Je hebt nog geen tags. Maak eerst tags aan via de &quot;Nieuwe
                tag&quot; knop op de CRM-pagina.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-slate-50"
                    style={{
                      borderColor: selectedTags.includes(tag.id)
                        ? tag.color
                        : undefined,
                      backgroundColor: selectedTags.includes(tag.id)
                        ? `${tag.color}15`
                        : undefined,
                      color: selectedTags.includes(tag.id)
                        ? tag.color
                        : undefined,
                    }}
                  >
                    <Checkbox
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                      className="hidden"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Bezig met opslaan..." : "Contact opslaan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
