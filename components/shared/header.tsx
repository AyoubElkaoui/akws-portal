"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overzicht",
  "/dashboard/projecten": "Projecten",
  "/dashboard/website": "Website",
  "/dashboard/facturen": "Facturen",
  "/dashboard/crm": "CRM",
  "/dashboard/bestanden": "Bestanden",
  "/dashboard/email": "E-mail",
  "/dashboard/afspraken": "Afspraken",
  "/dashboard/statistieken": "Statistieken",
  "/dashboard/reviews": "Reviews",
  "/dashboard/support": "Support",
  "/dashboard/instellingen": "Instellingen",
  "/admin": "Overzicht",
  "/admin/klanten": "Klanten",
  "/admin/tickets": "Tickets",
  "/admin/facturatie": "Klantfacturen",
  "/admin/facturatie/platform": "Platformfacturen",
  "/admin/onderhoud": "Onderhoud",
  "/admin/instellingen": "Instellingen",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Try parent path for detail pages like /dashboard/facturen/abc123
  const segments = pathname.split("/");
  while (segments.length > 2) {
    segments.pop();
    const parent = segments.join("/");
    if (pageTitles[parent]) return pageTitles[parent];
  }

  return "Dashboard";
}

interface HeaderProps {
  title?: string;
  mobileNav?: React.ReactNode;
}

export function Header({ title, mobileNav }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const pageTitle = title || getPageTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-2">
        {mobileNav}
        <h1 className="text-lg font-semibold text-slate-900">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-slate-200 text-sm font-medium text-slate-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-sm text-slate-500" disabled>
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600"
            >
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
