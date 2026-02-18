"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Globe,
  Receipt,
  Users,
  FileBox,
  Mail,
  CalendarDays,
  BarChart3,
  Star,
  Ticket,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderKanban,
  Globe,
  Receipt,
  Users,
  FileBox,
  Mail,
  CalendarDays,
  BarChart3,
  Star,
};

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface DashboardSidebarProps {
  companyName: string;
  modules: NavItem[];
  className?: string;
  primaryColor?: string;
  logo?: string | null;
}

export function DashboardSidebar({
  companyName,
  modules,
  className,
  primaryColor = "#0F172A",
  logo,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const staticItems = [
    { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  ];

  const bottomItems = [
    { href: "/dashboard/support", label: "Support", icon: Ticket },
    { href: "/dashboard/instellingen", label: "Instellingen", icon: Settings },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function activeStyle() {
    return {
      backgroundColor: primaryColor + "12",
      borderLeft: `3px solid ${primaryColor}`,
      color: primaryColor,
    };
  }

  return (
    <aside
      className={cn("flex h-screen w-64 flex-col border-r bg-white", className)}
    >
      <div className="flex h-16 items-center gap-3 px-6">
        {logo && (
          <img
            src={logo}
            alt={companyName}
            className="h-8 w-8 rounded object-contain"
          />
        )}
        <Link
          href="/dashboard"
          className="text-lg font-bold truncate"
          style={{ color: primaryColor }}
        >
          {companyName}
        </Link>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {staticItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  !active &&
                    "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
                style={active ? activeStyle() : undefined}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {modules.length > 0 && (
            <>
              <Separator className="my-3" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase text-slate-400">
                Modules
              </p>
              {modules.map((item) => {
                const Icon = iconMap[item.icon] || FolderKanban;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      !active &&
                        "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                    style={active ? activeStyle() : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}

          <Separator className="my-3" />

          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  !active &&
                    "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
                style={active ? activeStyle() : undefined}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Uitloggen
        </Button>
      </div>
    </aside>
  );
}
