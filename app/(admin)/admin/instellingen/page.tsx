import { requireAdmin } from "@/lib/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
      label: "Mollie API",
      configured: !!process.env.MOLLIE_API_KEY,
    },
    {
      key: "RESEND_API_KEY",
      label: "Resend (E-mail)",
      configured: !!process.env.RESEND_API_KEY,
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
    {
      key: "GOOGLE_PLACES_API_KEY",
      label: "Google Places",
      configured: !!process.env.GOOGLE_PLACES_API_KEY,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Configuratie overzicht
        </h2>
        <p className="text-sm text-slate-500">
          Status van API-koppelingen en externe services. Configuratie gebeurt
          via environment variabelen.
        </p>
      </div>

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
