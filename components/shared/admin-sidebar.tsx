"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Ticket,
  Receipt,
  FileText,
  Wrench,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "@/components/shared/command-palette";

const adminNavItems = [
  { href: "/admin", label: "Overzicht", icon: LayoutDashboard },
  { href: "/admin/klanten", label: "Klanten", icon: Users },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket },
  { href: "/admin/facturatie", label: "Klantfacturen", icon: Receipt },
  {
    href: "/admin/facturatie/platform",
    label: "Platformfacturen",
    icon: FileText,
  },
  { href: "/admin/onderhoud", label: "Onderhoud", icon: Wrench },
  { href: "/admin/instellingen", label: "Instellingen", icon: Settings },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r bg-slate-950 text-white",
        className,
      )}
    >
      <div className="flex h-16 items-center px-6">
        <Link href="/admin" className="text-lg font-bold">
          AK Web Solutions
        </Link>
      </div>
      <div className="px-3 pb-3">
        <CommandPalette />
      </div>
      <Separator className="bg-slate-800" />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            let isActive: boolean;
            if (item.href === "/admin") {
              isActive = pathname === "/admin";
            } else if (item.href === "/admin/facturatie") {
              isActive =
                pathname.startsWith("/admin/facturatie") &&
                !pathname.startsWith("/admin/facturatie/platform");
            } else {
              isActive = pathname.startsWith(item.href);
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t border-slate-800 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-900 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Uitloggen
        </Button>
      </div>
    </aside>
  );
}
