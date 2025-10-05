import { Menu, Bell, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  return (
    <header className="lg:hidden sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuClick}
        className="h-10 w-10 p-0"
        aria-label="Open menu"
        aria-expanded="false"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo */}
      <Link to="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shadow-brand">
          <img
            src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"
            alt="ArovaForex Logo"
            className="w-8 h-8 rounded-lg object-contain"
          />
        </div>
        <span className="font-bold text-base">
          <span className="text-foreground">Arova</span>
          <span className="text-primary">Forex</span>
        </span>
      </Link>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <NotificationsBell />
        <Link to="/dashboard/profile">
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0" aria-label="Profile">
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
};
