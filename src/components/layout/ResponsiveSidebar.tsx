import { useState, useEffect, useRef } from "react";
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
  Lock,
  NotebookPen,
  Calculator,
  X,
  Video
} from "lucide-react";
import { useLiveStreamStatus } from "@/hooks/useLiveStreamStatus";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Forecasts", href: "/dashboard/forecasts", icon: TrendingUp },
  { name: "Premium Signals", href: "/dashboard/signals", icon: Signal, premium: true },
  { name: "Live Room", href: "/dashboard/live-room", icon: Video, showLiveBadge: true },
  { name: "My Journal", href: "/dashboard/journal", icon: NotebookPen },
  { name: "Calculator", href: "/dashboard/calculator", icon: Calculator },
  { name: "My Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Join Academy", href: "/dashboard/academy", icon: BookOpen },
  { name: "Contact Us", href: "/dashboard/contact", icon: MessageCircle },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
];

const bottomItems = [
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface ResponsiveSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsiveSidebar = ({ isOpen, onClose }: ResponsiveSidebarProps) => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const { isLive } = useLiveStreamStatus();

  const isActive = (href: string) => location.pathname === href;

  // Close sidebar on route change (mobile/tablet only)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    if (mediaQuery.matches && isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    if (mediaQuery.matches && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Touch gestures for swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left - close sidebar
      onClose();
    }
  };

  // Focus management
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      const firstMenuItem = sidebarRef.current.querySelector<HTMLElement>('[role="menuitem"]');
      firstMenuItem?.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop - Only on mobile/tablet */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="main-sidebar"
        role="navigation"
        aria-label="Site navigation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "fixed top-0 left-0 h-screen bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out z-50",
          // Desktop - always visible
          "lg:translate-x-0 lg:w-60 lg:z-30",
          // Mobile/Tablet - overlay
          "w-[280px] shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-16 p-4 border-b border-border flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105"
            onClick={() => {
              const mediaQuery = window.matchMedia('(max-width: 1023px)');
              if (mediaQuery.matches) onClose();
            }}
          >
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shadow-brand">
              <img
                src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"
                alt="ArovaForex Logo"
                className="w-8 h-8 rounded-lg object-contain"
              />
            </div>
            <span className="font-bold text-lg">
              <span className="text-foreground group-hover:text-white transition-colors duration-300">Arova</span>
              <span className="text-primary group-hover:text-primary/80 transition-colors duration-300">Forex</span>
            </span>
          </Link>

          {/* Close button - Only on mobile/tablet */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden h-8 w-8 p-0"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const showLiveBadge = item.showLiveBadge && isLive;
            
            return (
              <Link 
                key={item.name} 
                to={item.href}
                onClick={() => {
                  const mediaQuery = window.matchMedia('(max-width: 1023px)');
                  if (mediaQuery.matches) onClose();
                }}
              >
                <Button
                  variant="ghost"
                  role="menuitem"
                  className={cn(
                    "w-full justify-start h-12 px-3 transition-all duration-200 group relative",
                    active && [
                      "bg-primary/10 text-primary font-semibold",
                      "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                      "before:w-1 before:h-3/5 before:bg-primary before:rounded-r"
                    ],
                    !active && "hover:bg-accent/50 hover:translate-x-1 lg:hover:translate-x-1"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mr-3 transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                    showLiveBadge && "text-red-500"
                  )} />
                  <span className="flex-1 text-left text-sm">
                    {item.name}
                  </span>
                  {item.premium && (
                    <Lock className="w-4 h-4 ml-auto opacity-50 text-premium" />
                  )}
                  {showLiveBadge && (
                    <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Items */}
        <div className="p-4 border-t border-border space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link 
                key={item.name} 
                to={item.href}
                onClick={() => {
                  const mediaQuery = window.matchMedia('(max-width: 1023px)');
                  if (mediaQuery.matches) onClose();
                }}
              >
                <Button
                  variant="ghost"
                  role="menuitem"
                  className={cn(
                    "w-full justify-start h-12 px-3 transition-all duration-200 group relative",
                    active && [
                      "bg-primary/10 text-primary font-semibold",
                      "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                      "before:w-1 before:h-3/5 before:bg-primary before:rounded-r"
                    ],
                    !active && "hover:bg-accent/50 hover:translate-x-1 lg:hover:translate-x-1"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mr-3 transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  <span className="text-sm">
                    {item.name}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
};
