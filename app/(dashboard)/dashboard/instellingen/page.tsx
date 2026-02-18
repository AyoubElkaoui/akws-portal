import { requireTenant } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { getTenantModules } from "@/lib/db/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LABELS, PLAN_PRICES, MODULE_DEFINITIONS } from "@/types";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { TenantForm } from "./tenant-form";
import { CheckCircle2, XCircle, Crown } from "lucide-react";

export default async function InstellingenPage() {
  const user = await requireTenant();

  const [dbUser, tenant, enabledModules] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    }),
    db.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        companyName: true,
        domain: true,
        plan: true,
        primaryColor: true,
        logo: true,
        slug: true,
        address: true,
        postalCode: true,
        city: true,
        phone: true,
        email: true,
        kvkNumber: true,
        btwNumber: true,
        iban: true,
        bic: true,
      },
    }),
    getTenantModules(user.tenantId),
  ]);

  if (!dbUser || !tenant) return null;

  const planPrice = PLAN_PRICES[tenant.plan];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Instellingen</h2>
        <p className="text-sm text-slate-500">
          Beheer je profiel en bedrijfsgegevens.
        </p>
      </div>

      {/* Plan info card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-amber-500" />
              Je abonnement
            </CardTitle>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 text-sm"
            >
              {PLAN_LABELS[tenant.plan]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">
              &euro;{planPrice}
            </span>
            <span className="text-sm text-slate-500">/maand</span>
          </div>

          {/* Module overview */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">
              Modules in je pakket
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODULE_DEFINITIONS.map((mod) => {
                const isEnabled = enabledModules.includes(mod.slug);
                const isInPlan = mod.plans.includes(tenant.plan);
                return (
                  <div
                    key={mod.slug}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                      isEnabled
                        ? "border-green-200 bg-green-50/50"
                        : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    {isEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isEnabled ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {mod.name}
                      </p>
                    </div>
                    {!isInPlan && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {mod.plans[0]}+
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan comparison hint */}
          {tenant.plan !== "PREMIUM" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                <strong>Meer nodig?</strong> Upgrade naar{" "}
                {tenant.plan === "STARTER" ? "Business of Premium" : "Premium"}{" "}
                voor extra modules. Neem contact op via een supportticket.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>
          Slug:{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            {tenant.slug}
          </code>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm name={dbUser.name} email={dbUser.email} />
        <PasswordForm />
        <TenantForm
          companyName={tenant.companyName}
          domain={tenant.domain}
          primaryColor={tenant.primaryColor}
          logo={tenant.logo}
          address={tenant.address}
          postalCode={tenant.postalCode}
          city={tenant.city}
          phone={tenant.phone}
          email={tenant.email}
          kvkNumber={tenant.kvkNumber}
          btwNumber={tenant.btwNumber}
          iban={tenant.iban}
          bic={tenant.bic}
        />
      </div>
    </div>
  );
}
