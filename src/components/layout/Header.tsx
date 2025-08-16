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
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105 lg:hidden"
          >
            <span className="font-bold text-lg group-hover:animate-pulse">
              <img  src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"
      alt="ArovaForex Logo"
      className="w-12 h-12 sm:w-10 sm:h-10 rounde.d-xl object-contain mb-2 sm:mb-0"
    />
              <span className="text-foreground group-hover:text-white transition-colors duration-300">Arova</span>
              <span className="text-brand-green group-hover:text-brand-green/80 transition-colors duration-300">Forex</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Bookmarked Forecasts */}
          <BookmarkedForecasts onForecastClick={(forecast) => {
            // Navigate to forecasts page and show the selected forecast
            window.location.href = `/dashboard/forecasts#forecast-${forecast.id}`;
          }} />

          {/* Notifications */}
          <NotificationsBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email || "Trader"}</span>
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
