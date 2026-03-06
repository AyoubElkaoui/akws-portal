import { requireAdmin } from "@/lib/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformSettingsForm } from "./platform-settings-form";

export default async function AdminInstellingenPage() {
  await requireAdmin();

  const envVars = [
    {
      key: "DATABASE_URL",
      label: "Database",
      configured: !!process.env.DATABASE_URL,
    },
    {
      key: "AUTH_SECRET",
      label: "Auth Secret",
      configured: !!process.env.AUTH_SECRET,
    },
    {
      key: "MOLLIE_API_KEY",
      label: "Mollie (Betalingen)",
      configured: !!process.env.MOLLIE_API_KEY,
    },
    {
      key: "SMTP_HOST",
      label: "SMTP (E-mail)",
      configured: !!(process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD),
    },
    {
      key: "R2_ACCESS_KEY_ID",
      label: "Cloudflare R2 (Bestanden)",
      configured: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ACCOUNT_ID),
    },
    {
      key: "CRON_SECRET",
      label: "Cron Beveiliging",
      configured: !!process.env.CRON_SECRET,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Instellingen</h2>
        <p className="text-sm text-slate-500">
          Beheer je bedrijfsgegevens en API-koppelingen.
        </p>
      </div>

      <PlatformSettingsForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Koppelingen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envVars.map((env) => (
              <div
                key={env.key}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {env.label}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{env.key}</p>
                </div>
                <Badge
                  className={
                    env.configured
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }
                >
                  {env.configured ? "Geconfigureerd" : "Niet ingesteld"}
                </Badge>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            API-sleutels worden beheerd via environment variabelen op de server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
