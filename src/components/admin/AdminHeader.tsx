import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Search, User, LogOut, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const adminPages = [
  { title: "Home", path: "/admin" },
  { title: "Users", path: "/admin/users" },
  { title: "Content", path: "/admin/content" },
  { title: "Calendar Events", path: "/admin/calendar-events" },
  { title: "Analytics", path: "/admin/analytics" },
  { title: "Notifications", path: "/admin/notifications" },
  { title: "Contact", path: "/admin/contact" },
  { title: "Contact Analytics", path: "/admin/contact-analytics" },
  { title: "Live Stream", path: "/admin/live-stream" },
  { title: "AI Assistant", path: "/admin/ai-assistant" },
];

export const AdminHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [notifResult, profileResult] = await Promise.all([
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
        supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single(),
      ]);
      setUnreadCount(notifResult.count || 0);
      if (profileResult.data) setProfile(profileResult.data);
    };

    loadData();

    const channel = supabase
      .channel("admin-header-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false)
          .then(({ count }) => setUnreadCount(count || 0));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filteredPages = searchQuery
    ? adminPages.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto max-w-7xl h-14 px-4 flex items-center gap-4">
        <SidebarTrigger className="mr-2" />

        {/* Date/Time */}
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span>{dateStr}</span>
          <span className="text-border">•</span>
          <span>{timeStr}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </Button>

          {/* Search */}
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)}>
              <Search className="w-4 h-4" />
            </Button>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-12 w-64 bg-popover border border-border rounded-lg shadow-lg p-2 z-50"
              >
                <Input
                  placeholder="Search admin pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="h-8 text-sm"
                />
                {filteredPages.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {filteredPages.map((page) => (
                      <button
                        key={page.path}
                        onClick={() => { navigate(page.path); setShowSearch(false); setSearchQuery(""); }}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                      >
                        {page.title}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/admin/notifications")}>
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </Button>

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                <User className="w-4 h-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};
