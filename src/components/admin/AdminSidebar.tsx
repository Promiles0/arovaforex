import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FileText, BarChart2, Bell, Inbox,
  NotebookPen, TrendingUp, CalendarDays, Radio, Bot,
  ArrowLeft, LogOut, ChevronDown, Shield
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Home", url: "/admin", icon: LayoutDashboard },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Content", url: "/admin/content", icon: FileText },
      { title: "Calendar Events", url: "/admin/calendar-events", icon: CalendarDays },
      { title: "Journal", url: "/admin/journal", icon: NotebookPen },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Notifications", url: "/admin/notifications", icon: Bell, badgeKey: "notifications" as const },
      { title: "Contact", url: "/admin/contact", icon: Inbox, badgeKey: "contact" as const },
      { title: "Contact Analytics", url: "/admin/contact-analytics", icon: TrendingUp },
      { title: "Live Stream", url: "/admin/live-stream", icon: Radio },
      { title: "AI Assistant", url: "/admin/ai-assistant", icon: Bot },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Audit Log", url: "/admin/audit-log", icon: Shield },
    ],
  },
];

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.25, ease: "easeOut" },
  }),
};

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";
  const [badges, setBadges] = useState<Record<string, number>>({ notifications: 0, contact: 0 });

  useEffect(() => {
    loadBadges();
    const ch = supabase.channel("admin-sidebar-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, loadBadges)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const loadBadges = async () => {
    const [contactRes] = await Promise.all([
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);
    setBadges({ notifications: 0, contact: contactRes.count || 0 });
  };

  const isActive = (url: string) =>
    url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(url);

  const getNavCls = ({ isActive: active }: { isActive: boolean }) =>
    `${active
      ? "bg-primary/15 text-primary font-medium border-l-2 border-primary shadow-[inset_0_0_12px_-4px_hsl(var(--primary)/0.15)]"
      : "hover:bg-[hsl(240,3.7%,15.9%)]/60 text-[hsl(240,5%,65%)] hover:text-[hsl(0,0%,90%)]"
    } flex items-center gap-2 transition-all duration-200`;

  let globalIndex = 0;

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className={`${collapsed ? "w-14" : "w-64"} [&>div]:bg-[hsl(240,10%,5%)] [&>div]:text-[hsl(0,0%,90%)] [&>div]:border-r-[hsl(240,3.7%,15.9%)]`}>
      <div className="p-4 flex items-center gap-3 border-b border-[hsl(240,3.7%,15.9%)]">
        <img
          src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"
          alt="Arova Logo"
          className="w-8 h-8 rounded-lg object-contain"
        />
        {!collapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-[hsl(0,0%,95%)] tracking-tight">
            Arova Admin
          </motion.span>
        )}
      </div>

      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent className="flex-1">
        {navGroups.map((group) => {
          const groupHasActive = group.items.some(
            (i) => isActive(i.url)
          );

          return (
            <SidebarGroup key={group.label}>
              <Collapsible defaultOpen={groupHasActive || true}>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-[hsl(0,0%,90%)] text-[hsl(240,5%,55%)] transition-colors">
                    {!collapsed && <span>{group.label}</span>}
                    {!collapsed && <ChevronDown className="w-3 h-3" />}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const idx = globalIndex++;
                        const badgeCount = (item as any).badgeKey ? badges[(item as any).badgeKey] : 0;
                        return (
                          <motion.div key={item.title} custom={idx} initial="hidden" animate="visible" variants={itemVariants}>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild>
                                <NavLink to={item.url} end={item.url === "/admin"} className={getNavCls}>
                                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                                  {!collapsed && (
                                    <span className="flex-1 flex items-center justify-between">
                                      <span>{item.title}</span>
                                      {badgeCount > 0 && (
                                        <Badge variant="destructive" className="text-[10px] h-5 min-w-5 px-1.5 ml-2">
                                          {badgeCount > 99 ? "99+" : badgeCount}
                                        </Badge>
                                      )}
                                    </span>
                                  )}
                                  {collapsed && badgeCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-destructive" />
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </motion.div>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <div className="border-t border-border/50 p-3 space-y-1">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          {!collapsed && <span>Back to App</span>}
        </button>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </Sidebar>
  );
}
