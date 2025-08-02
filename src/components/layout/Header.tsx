import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import BookmarkedForecasts from "@/components/forecasts/BookmarkedForecasts";

export const Header = () => {
  const { user, signOut } = useAuth();
  const notificationCount = 3; // Mock data

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105 lg:hidden"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-green/80 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg group-hover:animate-pulse">
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
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

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
              <DropdownMenuItem>
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
