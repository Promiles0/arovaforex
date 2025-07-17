import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  TrendingUp,
  Signal,
  Wallet,
  BookOpen,
  MessageCircle,
  Calendar,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Lock
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Forecasts", href: "/dashboard/forecasts", icon: TrendingUp },
  { name: "Premium Signals", href: "/dashboard/signals", icon: Signal, premium: true },
  { name: "My Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Join Academy", href: "/dashboard/academy", icon: BookOpen, premium: true },
  { name: "Support", href: "/dashboard/support", icon: MessageCircle },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
];

const bottomItems = [
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Arova
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <Link key={item.name} to={item.href}>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-10 transition-all duration-200",
                collapsed ? "px-2" : "px-3",
                isActive(item.href) && "bg-secondary/80 text-secondary-foreground font-medium",
                item.premium && "relative"
              )}
            >
              <item.icon className={cn("w-4 h-4", !collapsed && "mr-3")} />
              {!collapsed && (
                <span className="flex items-center gap-2">
                  {item.name}
                  {item.premium && (
                    <Lock className="w-3 h-3 text-premium" />
                  )}
                </span>
              )}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="p-4 border-t border-border space-y-2">
        {bottomItems.map((item) => (
          <Link key={item.name} to={item.href}>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-10",
                collapsed ? "px-2" : "px-3",
                isActive(item.href) && "bg-secondary/80 text-secondary-foreground font-medium"
              )}
            >
              <item.icon className={cn("w-4 h-4", !collapsed && "mr-3")} />
              {!collapsed && item.name}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};