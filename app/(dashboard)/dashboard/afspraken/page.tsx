import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { tenantScope } from "@/lib/db/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";
import { CreateAppointmentDialog } from "./create-appointment-dialog";
import { AppointmentActions } from "./appointment-actions";
import { AvailabilityForm } from "./availability-form";

const statusConfig: Record<string, { label: string; className: string }> = {
  BEVESTIGD: {
    label: "Bevestigd",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  GEANNULEERD: {
    label: "Geannuleerd",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  AFGEROND: {
    label: "Afgerond",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function AfsprakenPage() {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "afspraken"))) {
    redirect("/dashboard");
  }

  const [appointments, availabilitySlots] = await Promise.all([
    db.appointment.findMany({
      where: { ...tenantScope(user.tenantId) },
      orderBy: { date: "asc" },
    }),
    db.availabilitySlot.findMany({
      where: { ...tenantScope(user.tenantId) },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const upcoming = appointments.filter(
    (a) =>
      a.status === "BEVESTIGD" &&
      new Date(a.date) >= new Date(new Date().toDateString()),
  );
  const past = appointments.filter(
    (a) =>
      a.status !== "BEVESTIGD" ||
      new Date(a.date) < new Date(new Date().toDateString()),
  );

  // Stats
  const todayAppointments = appointments.filter(
    (a) =>
      a.status === "BEVESTIGD" &&
      new Date(a.date).toDateString() === new Date().toDateString(),
  );
  const weekAppointments = upcoming.filter((a) => {
    const diff = new Date(a.date).getTime() - Date.now();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Afspraken</h2>
          <p className="text-sm text-slate-500">
            Beheer je afspraken en beschikbaarheid.
          </p>
        </div>
        <CreateAppointmentDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Vandaag</p>
              <p className="text-xl font-bold text-slate-900">
                {todayAppointments.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CalendarDays className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Deze week</p>
              <p className="text-xl font-bold text-slate-900">
                {weekAppointments.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <CheckCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Aankomend</p>
              <p className="text-xl font-bold text-slate-900">
                {upcoming.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Aankomend ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">Geschiedenis ({past.length})</TabsTrigger>
          <TabsTrigger value="availability">Beschikbaarheid</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 text-center">
                  Geen aankomende afspraken. Plan je eerste afspraak in.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Klant</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Tijd</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcoming.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium text-slate-900">
                              {apt.customerName}
                            </span>
                            <br />
                            <span className="text-xs text-slate-500">
                              {apt.customerEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {formatDate(apt.date)}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {apt.startTime} - {apt.endTime}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusConfig[apt.status]?.className}
                          >
                            {statusConfig[apt.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AppointmentActions
                            appointmentId={apt.id}
                            status={apt.status}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-slate-500">
                  Geen eerdere afspraken.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Klant</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Tijd</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {past.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium text-slate-900">
                          {apt.customerName}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatDate(apt.date)}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {apt.startTime} - {apt.endTime}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusConfig[apt.status]?.className}
                          >
                            {statusConfig[apt.status]?.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <AvailabilityForm
            initialSlots={availabilitySlots.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              active: s.active,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
