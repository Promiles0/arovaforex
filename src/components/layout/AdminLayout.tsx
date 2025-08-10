import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Outlet } from "react-router-dom";

export const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <Outlet />
          </main>
          <footer className="sticky bottom-0 w-full border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4 text-sm text-muted-foreground">
              <a className="hover:text-foreground transition-colors" href="/terms">Terms</a>
              <span>•</span>
              <a className="hover:text-foreground transition-colors" href="/privacy">Privacy Policy</a>
              <span className="ml-auto">Arova Admin</span>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
