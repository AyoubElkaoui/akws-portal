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
import { Users, StickyNote } from "lucide-react";
import { CreateContactDialog } from "./create-contact-dialog";
import { CreateTagDialog } from "./create-tag-dialog";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function CrmPage() {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "crm"))) {
    redirect("/dashboard");
  }

  const [contacts, tags] = await Promise.all([
    db.contact.findMany({
      where: { ...tenantScope(user.tenantId) },
      orderBy: { createdAt: "desc" },
      include: {
        contactTags: { include: { tag: true } },
        _count: { select: { contactNotes: true } },
      },
    }),
    db.contactTag.findMany({
      where: { ...tenantScope(user.tenantId) },
      orderBy: { name: "asc" },
      include: { _count: { select: { contacts: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">CRM</h2>
          <p className="text-sm text-slate-500">
            Beheer je klanten en contacten.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateTagDialog />
          <CreateContactDialog />
        </div>
      </div>

      {/* Tags overview */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="cursor-default"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                borderColor: tag.color,
              }}
            >
              {tag.name} ({tag._count.contacts})
            </Badge>
          ))}
        </div>
      )}

      {/* Contacts table */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 text-center">
              Je hebt nog geen contacten. Voeg je eerste contact toe.
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
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefoon</TableHead>
                  <TableHead>Bedrijf</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Notities</TableHead>
                  <TableHead>Toegevoegd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/crm/${contact.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {contact.email || "—"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {contact.phone || "—"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {contact.company || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
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
                    </TableCell>
                    <TableCell>
                      {contact._count.contactNotes > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <StickyNote className="h-3.5 w-3.5" />
                          {contact._count.contactNotes}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(contact.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
