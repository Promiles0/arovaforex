import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

export const AdminHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl h-14 px-4 flex items-center gap-4">
        <SidebarTrigger className="mr-2" />
        <Link to="/" className="font-semibold tracking-tight hover:opacity-90 transition-opacity">
          Arova Admin
        </Link>
        <div className="ml-auto text-sm text-muted-foreground">
          Admin console
        </div>
      </div>
    </header>
  );
};
