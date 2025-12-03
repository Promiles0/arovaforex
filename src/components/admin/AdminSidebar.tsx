import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, BarChart2, Bell, Inbox, NotebookPen, TrendingUp, CalendarDays } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Home", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Content", url: "/admin/content", icon: FileText },
  { title: "Calendar Events", url: "/admin/calendar-events", icon: CalendarDays },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart2 },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Contact", url: "/admin/contact", icon: Inbox },
  { title: "Contact Analytics", url: "/admin/contact-analytics", icon: TrendingUp },
  { title: "Journal", url: "/admin/journal", icon: NotebookPen },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `${isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"} flex items-center gap-2`;

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className={collapsed ? "w-14" : "w-64"}>
      <SidebarTrigger className="m-2 self-end" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
