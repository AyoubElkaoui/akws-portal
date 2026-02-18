import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled, tenantScope } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Clock,
  AlertTriangle,
} from "lucide-react";

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

function getScheduleStatus(project: {
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  milestones: { completed: boolean; dueDate: Date | null }[];
}) {
  if (project.status !== "ACTIEF") return null;

  const now = new Date();

  // Check if any milestones are overdue
  const overdueMilestones = project.milestones.filter(
    (m) => !m.completed && m.dueDate && new Date(m.dueDate) < now,
  );
  if (overdueMilestones.length > 0) {
    return { label: "Vertraagd", color: "text-red-600", bg: "bg-red-50" };
  }

  // Check if project end date has passed
  if (project.endDate && new Date(project.endDate) < now) {
    return { label: "Vertraagd", color: "text-red-600", bg: "bg-red-50" };
  }

  // Check if we're close to the end date (within 7 days)
  if (project.endDate) {
    const daysLeft = Math.ceil(
      (new Date(project.endDate).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysLeft <= 7 && daysLeft > 0) {
      return {
        label: "Bijna deadline",
        color: "text-orange-600",
        bg: "bg-orange-50",
      };
    }
  }

  return { label: "Op schema", color: "text-green-600", bg: "bg-green-50" };
}

export default async function ProjectenPage() {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "projecten"))) {
    redirect("/dashboard");
  }

  const projects = await db.project.findMany({
    where: { ...tenantScope(user.tenantId) },
    orderBy: { updatedAt: "desc" },
    include: {
      milestones: {
        select: { id: true, completed: true, dueDate: true },
      },
      _count: { select: { revisions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Projecten</h2>
        <p className="text-sm text-slate-500">
          Beheer je projecten, milestones en revisies.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="mb-3 size-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              Je hebt nog geen projecten.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalMilestones = project.milestones.length;
            const completedMilestones = project.milestones.filter(
              (m) => m.completed,
            ).length;
            const status = statusConfig[project.status] ?? statusConfig.OFFERTE;
            const schedule = getScheduleStatus(project);

            return (
              <Link
                key={project.id}
                href={`/dashboard/projecten/${project.id}`}
                className="group"
              >
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {project.name}
                      </CardTitle>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    {schedule && (
                      <div
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${schedule.color} ${schedule.bg} w-fit`}
                      >
                        {schedule.label === "Vertraagd" ? (
                          <AlertTriangle className="size-3" />
                        ) : schedule.label === "Bijna deadline" ? (
                          <Clock className="size-3" />
                        ) : (
                          <CheckCircle2 className="size-3" />
                        )}
                        {schedule.label}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Milestone progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" />
                          Milestones
                        </span>
                        <span>
                          {completedMilestones}/{totalMilestones}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{
                            width:
                              totalMilestones > 0
                                ? `${(completedMilestones / totalMilestones) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>

                    {/* Timeline bar */}
                    {project.startDate && project.endDate && (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          {(() => {
                            const start = new Date(
                              project.startDate!,
                            ).getTime();
                            const end = new Date(project.endDate!).getTime();
                            const now = Date.now();
                            const progress = Math.min(
                              100,
                              Math.max(
                                0,
                                ((now - start) / (end - start)) * 100,
                              ),
                            );
                            return (
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress >= 100 && project.status === "ACTIEF"
                                    ? "bg-red-400"
                                    : "bg-blue-400"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Dates + revision count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="size-3.5" />
                        <span>
                          {project.startDate
                            ? new Date(project.startDate).toLocaleDateString(
                                "nl-NL",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                          {" – "}
                          {project.endDate
                            ? new Date(project.endDate).toLocaleDateString(
                                "nl-NL",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                        </span>
                      </div>
                      {project._count.revisions > 0 && (
                        <span className="text-xs text-slate-400">
                          {project._count.revisions} revisie
                          {project._count.revisions !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
