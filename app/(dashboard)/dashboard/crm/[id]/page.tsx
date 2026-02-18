import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { tenantScope } from "@/lib/db/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Clock,
  StickyNote,
} from "lucide-react";
import { AddNoteForm } from "./add-note-form";
import { ContactActions } from "./contact-actions";
import { EditContactDialog } from "./edit-contact-dialog";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "crm"))) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const contact = await db.contact.findFirst({
    where: { id, ...tenantScope(user.tenantId) },
    include: {
      contactTags: { include: { tag: true } },
      contactNotes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contact) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {contact.firstName} {contact.lastName}
            </h2>
            <p className="text-sm text-slate-500">
              Toegevoegd op {formatDate(contact.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditContactDialog
            contact={{
              id: contact.id,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
              notes: contact.notes,
            }}
          />
          <ContactActions contactId={contact.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Contactgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {contact.company}
                </span>
              </div>
            )}
            {contact.lastContactedAt && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-500">
                  Laatst gecontact: {formatDate(contact.lastContactedAt)}
                </span>
              </div>
            )}

            {/* Tags */}
            {contact.contactTags.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {contact.contactTags.map((ct) => (
                    <Badge
                      key={ct.id}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${ct.tag.color}15`,
                        color: ct.tag.color,
                      }}
                    >
                      {ct.tag.name}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {/* Initial notes */}
            {contact.notes && (
              <>
                <Separator />
                <p className="text-sm text-slate-600">{contact.notes}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Notities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddNoteForm contactId={contact.id} />

            {contact.contactNotes.length > 0 ? (
              <div className="space-y-3 pt-2">
                {contact.contactNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border bg-slate-50 p-3"
                  >
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <StickyNote className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">
                  Nog geen notities. Voeg je eerste notitie toe.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
