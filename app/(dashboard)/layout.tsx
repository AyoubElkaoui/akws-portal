import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/auth";
import { getTenant, getTenantModules } from "@/lib/db/tenant";
import { MODULE_DEFINITIONS } from "@/types";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { Header } from "@/components/shared/header";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Admins visiting dashboard get redirected to admin
  if (user.role === "ADMIN" && !user.tenantId) {
    redirect("/admin");
  }

  if (!user.tenantId) {
    redirect("/login");
  }

  const [tenant, enabledModuleSlugs] = await Promise.all([
    getTenant(user.tenantId),
    getTenantModules(user.tenantId),
  ]);

  if (!tenant || !tenant.active) {
    redirect("/login");
  }

  // Build navigation items from enabled modules
  const moduleNavItems = MODULE_DEFINITIONS.filter((m) =>
    enabledModuleSlugs.includes(m.slug),
  ).map((m) => ({
    href: m.href,
    label: m.name,
    icon: m.icon,
  }));

  const sidebarProps = {
    companyName: tenant.companyName,
    modules: moduleNavItems,
    primaryColor: tenant.primaryColor,
    logo: tenant.logo,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar {...sidebarProps} className="hidden md:flex" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          mobileNav={
            <MobileSidebar>
              <DashboardSidebar {...sidebarProps} />
            </MobileSidebar>
          }
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
