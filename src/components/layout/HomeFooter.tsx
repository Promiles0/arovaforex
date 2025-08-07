import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export const HomeFooter = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleProtectedLink = (path: string, pageName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: `🔒 Please log in to access ${pageName}.`,
        action: (
          <Link 
            to="/auth" 
            className="underline hover:no-underline text-primary font-medium"
          >
            Login
          </Link>
        ),
      });
      return null;
    }
    return path;
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-success rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="text-2xl font-bold">
                <span className="text-foreground">Arova</span>
                <span className="text-primary">Forex</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              Professional Forex trading platform providing premium market forecasts, 
              exclusive trading signals, and institutional-level analysis.
            </p>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="font-semibold mb-4">Quick Access</h4>
            <div className="space-y-2">
              {user ? (
                <>
                  <Link 
                    to="/dashboard/forecasts" 
                    className="block text-muted-foreground hover:text-primary transition-colors"
                  >
                    My Forecasts
                  </Link>
                  <Link 
                    to="/dashboard/signals" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    My Signals
                    <Lock className="w-3 h-3" />
                  </Link>
                  <Link 
                    to="/dashboard/academy" 
                    className="block text-muted-foreground hover:text-primary transition-colors"
                  >
                    Join Academy
                  </Link>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleProtectedLink("/dashboard/forecasts", "Forecasts")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    My Forecasts
                    <Lock className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleProtectedLink("/dashboard/signals", "Premium Signals")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    My Signals
                    <Lock className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleProtectedLink("/dashboard/academy", "Academy")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    Join Academy
                    <Lock className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              {user ? (
                <Link 
                  to="/dashboard/contact" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              ) : (
                <button 
                  onClick={() => handleProtectedLink("/dashboard/contact", "Contact Us")}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Contact Us
                  <Lock className="w-3 h-3" />
                </button>
              )}
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2024 ArovaForex. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              Trading involves risk. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};