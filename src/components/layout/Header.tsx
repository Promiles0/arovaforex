import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import BookmarkedForecasts from "@/components/forecasts/BookmarkedForecasts";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    navigate("/dashboard/profile");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
      <div className="w-full h-14 px-2 sm:px-4 lg:px-6 flex items-center justify-between">
        {/* Mobile Logo - Only show on mobile when sidebar is collapsed */}
        <div className="flex items-center lg:hidden">
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-all duration-300 hover:scale-105"
          >
            <img 
              src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"
              alt="ArovaForex Logo"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <div className="font-bold text-base">
              <span className="text-foreground">Arova</span>
              <span className="text-primary">Forex</span>
            </div>
          </Link>
        </div>

        {/* Desktop Spacer */}
        <div className="hidden lg:block flex-1"></div>

        {/* Action Items - Always visible, properly spaced */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
          {/* Bookmarked Forecasts */}
          <div className="flex-shrink-0">
            <BookmarkedForecasts onForecastClick={(forecast) => {
              window.location.href = `/dashboard/forecasts#forecast-${forecast.id}`;
            }} />
          </div>

          {/* Notifications */}
          <div className="flex-shrink-0">
            <NotificationsBell />
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 h-8 px-2 sm:px-3 min-w-0 max-w-[200px] sm:max-w-none"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium truncate hidden sm:inline-block">
                  {user?.user_metadata?.full_name || user?.email || "Trader"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
