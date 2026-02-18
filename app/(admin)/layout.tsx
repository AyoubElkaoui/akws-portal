import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { Header } from "@/components/shared/header";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar className="hidden md:flex" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          mobileNav={
            <MobileSidebar>
              <AdminSidebar />
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
