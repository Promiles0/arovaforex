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
  Lock,
  NotebookPen
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Forecasts", href: "/dashboard/forecasts", icon: TrendingUp },
  { name: "Premium Signals", href: "/dashboard/signals", icon: Signal, premium: true },
  { name: "My Journal", href: "/dashboard/journal", icon: NotebookPen },
  { name: "My Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Join Academy", href: "/dashboard/academy", icon: BookOpen },
  { name: "Contact Us", href: "/dashboard/contact", icon: MessageCircle },
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
      "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 sticky top-0",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <Link 
            to="/" 
            className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105"
          >
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shadow-brand">
              {/* <TrendingUp className="w-5 h-5 text-white" /> */}
            <img
  
      src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"

      alt="ArovaForex Logo"
      className="w-12 h-12 sm:w-10 sm:h-10 rounde.d-xl object-contain mb-2 sm:mb-0"
    />
            </div>
            <span className="font-bold text-lg group-hover:animate-pulse">
              <span className="text-foreground group-hover:text-white transition-colors duration-300">Arova</span>
              <span className="text-primary group-hover:text-primary/80 transition-colors duration-300">Forex</span>
            </span>
          </Link>
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
              variant={isActive(item.href) ? "ghost" : "ghost"}
              className={cn(
                "w-full justify-start h-10 transition-all duration-200 group",
                collapsed ? "px-2" : "px-3",
                isActive(item.href) && "bg-primary/10 text-primary font-medium border-r-2 border-primary",
                !isActive(item.href) && "hover:bg-primary/5 hover:text-primary",
                item.premium && "relative"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-colors duration-200", 
                !collapsed && "mr-3",
                isActive(item.href) && "text-primary",
                !isActive(item.href) && "group-hover:text-primary"
              )} />
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
              variant={isActive(item.href) ? "ghost" : "ghost"}
              className={cn(
                "w-full justify-start h-10 transition-all duration-200 group",
                collapsed ? "px-2" : "px-3",
                isActive(item.href) && "bg-primary/10 text-primary font-medium border-r-2 border-primary",
                !isActive(item.href) && "hover:bg-primary/5 hover:text-primary"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-colors duration-200", 
                !collapsed && "mr-3",
                isActive(item.href) && "text-primary",
                !isActive(item.href) && "group-hover:text-primary"
              )} />
              {!collapsed && (
                <span className={cn(
                  "transition-colors duration-200",
                  isActive(item.href) && "text-primary"
                )}>
                  {item.name}
                </span>
              )}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};