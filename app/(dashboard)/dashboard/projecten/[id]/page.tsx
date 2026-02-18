import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { RequestRevisionDialog } from "./request-revision-dialog";

const statusConfig: Record<string, { label: string; className: string }> = {
  OFFERTE: {
    label: "Offerte",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  ACTIEF: {
    label: "Actief",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  AFGEROND: {
    label: "Afgerond",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  GEPAUZEERD: {
    label: "Gepauzeerd",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

const revisionStatusConfig: Record<
  string,
  { label: string; className: string; step: number }
> = {
  AANGEVRAAGD: {
    label: "Aangevraagd",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    step: 1,
  },
  IN_BEHANDELING: {
    label: "In behandeling",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    step: 2,
  },
  AFGEROND: {
    label: "Afgerond",
    className: "bg-green-100 text-green-700 border-green-200",
    step: 3,
  },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "projecten"))) {
    redirect("/dashboard");
  }

  const project = await db.project.findUnique({
    where: { id },
    include: {
      milestones: { orderBy: { dueDate: "asc" } },
      revisions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project || project.tenantId !== user.tenantId) {
    notFound();
  }

  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter(
    (m) => m.completed,
  ).length;
  const progressPercent =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const status = statusConfig[project.status] ?? statusConfig.OFFERTE;

  const now = new Date();
  const isOverdue =
    project.status === "ACTIEF" &&
    project.endDate &&
    new Date(project.endDate) < now;

  // Calculate timeline progress
  let timelineProgress = 0;
  if (project.startDate && project.endDate) {
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    timelineProgress = Math.min(
      100,
      Math.max(0, ((now.getTime() - start) / (end - start)) * 100),
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/dashboard/projecten">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="size-4" />
          Terug naar projecten
        </Button>
      </Link>

      {/* Project header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="size-3" />
                    Vertraagd
                  </Badge>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-slate-500">{project.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              <span>
                Start:{" "}
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Niet ingesteld"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              <span>
                Einde:{" "}
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Niet ingesteld"}
              </span>
            </div>
          </div>

          {/* Visual timeline bar */}
          {project.startDate && project.endDate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {new Date(project.startDate).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="font-medium text-slate-600">
                  {Math.round(timelineProgress)}% van de tijd verstreken
                </span>
                <span>
                  {new Date(project.endDate).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                {/* Time elapsed */}
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                    timelineProgress >= 100 && project.status === "ACTIEF"
                      ? "bg-red-300"
                      : "bg-blue-200"
                  }`}
                  style={{ width: `${timelineProgress}%` }}
                />
                {/* Work completed */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-green-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Milestone markers */}
                {project.milestones
                  .filter((m) => m.dueDate)
                  .map((m) => {
                    const start = new Date(project.startDate!).getTime();
                    const end = new Date(project.endDate!).getTime();
                    const pos =
                      ((new Date(m.dueDate!).getTime() - start) /
                        (end - start)) *
                      100;
                    if (pos < 0 || pos > 100) return null;
                    return (
                      <div
                        key={m.id}
                        className={`absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full border-2 border-white ${
                          m.completed ? "bg-green-500" : "bg-slate-400"
                        }`}
                        style={{ left: `${pos}%` }}
                        title={m.title}
                      />
                    );
                  })}
              </div>
              <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Werk voltooid ({Math.round(progressPercent)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-200" />
                  Tijd verstreken
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones section - vertical timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Milestones</CardTitle>
            <span className="text-sm text-slate-500">
              {completedMilestones}/{totalMilestones} voltooid
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {totalMilestones === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Geen milestones gevonden.
            </p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
              <ul className="space-y-0">
                {project.milestones.map((milestone, index) => {
                  const isOverdueMilestone =
                    !milestone.completed &&
                    milestone.dueDate &&
                    new Date(milestone.dueDate) < now;

                  return (
                    <li
                      key={milestone.id}
                      className="relative flex items-start gap-4 py-3"
                    >
                      {/* Icon on the timeline */}
                      <div className="relative z-10 shrink-0">
                        {milestone.completed ? (
                          <CheckCircle2 className="size-6 text-green-500 bg-white rounded-full" />
                        ) : isOverdueMilestone ? (
                          <AlertTriangle className="size-6 text-red-500 bg-white rounded-full p-0.5" />
                        ) : (
                          <Circle className="size-6 text-slate-300 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            milestone.completed
                              ? "text-slate-400 line-through"
                              : isOverdueMilestone
                                ? "text-red-700"
                                : "text-slate-700"
                          }`}
                        >
                          {milestone.title}
                        </p>
                        {milestone.dueDate && (
                          <p
                            className={`mt-0.5 flex items-center gap-1 text-xs ${
                              isOverdueMilestone
                                ? "text-red-500 font-medium"
                                : "text-slate-400"
                            }`}
                          >
                            <Clock className="size-3" />
                            {isOverdueMilestone ? "Verlopen: " : ""}
                            {new Date(milestone.dueDate).toLocaleDateString(
                              "nl-NL",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revisions section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Revisies</CardTitle>
            <RequestRevisionDialog projectId={project.id} />
          </div>
        </CardHeader>
        <CardContent>
          {project.revisions.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Geen revisies gevonden. Gebruik de knop hierboven om een revisie
              aan te vragen.
            </p>
          ) : (
            <ul className="space-y-4">
              {project.revisions.map((revision) => {
                const revStatus =
                  revisionStatusConfig[revision.status] ??
                  revisionStatusConfig.AANGEVRAAGD;
                const currentStep = revStatus.step;

                return (
                  <li
                    key={revision.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm text-slate-700">
                          {revision.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(revision.createdAt).toLocaleDateString(
                            "nl-NL",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className={revStatus.className}>
                        {revStatus.label}
                      </Badge>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-1">
                      {[
                        { step: 1, label: "Aangevraagd" },
                        { step: 2, label: "In behandeling" },
                        { step: 3, label: "Afgerond" },
                      ].map((s, i) => (
                        <div
                          key={s.step}
                          className="flex items-center gap-1 flex-1"
                        >
                          <div
                            className={`h-1.5 flex-1 rounded-full ${
                              currentStep >= s.step
                                ? s.step === 3
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                                : "bg-slate-200"
                            }`}
                          />
                          {i < 2 && <div className="w-1" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Aangevraagd</span>
                      <span>In behandeling</span>
                      <span>Afgerond</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
