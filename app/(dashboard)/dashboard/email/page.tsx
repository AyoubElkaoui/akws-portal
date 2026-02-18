import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { tenantScope } from "@/lib/db/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Inbox, Send, Users } from "lucide-react";
import { CreateCampaignDialog } from "./create-campaign-dialog";
import { CampaignActions } from "./campaign-actions";
import { SubmissionList } from "./submission-list";

const statusConfig: Record<string, { label: string; className: string }> = {
  CONCEPT: {
    label: "Concept",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  GEPLAND: {
    label: "Gepland",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  VERZONDEN: {
    label: "Verzonden",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function EmailPage() {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "email"))) {
    redirect("/dashboard");
  }

  const [campaigns, submissions] = await Promise.all([
    db.emailCampaign.findMany({
      where: { ...tenantScope(user.tenantId) },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { recipients: true } } },
    }),
    db.formSubmission.findMany({
      where: { ...tenantScope(user.tenantId) },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const unreadCount = submissions.filter((s) => !s.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">E-mail</h2>
          <p className="text-sm text-slate-500">
            Verstuur nieuwsbrieven en bekijk formulier-inzendingen.
          </p>
        </div>
        <CreateCampaignDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Campagnes</p>
              <p className="text-xl font-bold text-slate-900">
                {campaigns.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Verzonden</p>
              <p className="text-xl font-bold text-slate-900">
                {campaigns.filter((c) => c.status === "VERZONDEN").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Inbox className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ongelezen inzendingen</p>
              <p className="text-xl font-bold text-slate-900">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="submissions">
            Inzendingen
            {unreadCount > 0 && (
              <Badge
                className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 text-center">
                  Je hebt nog geen campagnes. Maak je eerste nieuwsbrief aan.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Onderwerp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ontvangers</TableHead>
                      <TableHead>Aangemaakt</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => {
                      const status = statusConfig[campaign.status];
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium text-slate-900">
                            {campaign.subject}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={status.className}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {campaign._count.recipients}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {formatDate(campaign.createdAt)}
                          </TableCell>
                          <TableCell>
                            <CampaignActions
                              campaignId={campaign.id}
                              status={campaign.status}
                              recipientCount={campaign._count.recipients}
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
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <SubmissionList
            submissions={submissions.map((sub) => ({
              id: sub.id,
              formName: sub.formName,
              data: sub.data as Record<string, unknown>,
              read: sub.read,
              createdAt: sub.createdAt.toISOString(),
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
