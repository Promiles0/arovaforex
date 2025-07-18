import { Button } from "@/components/ui/button";
import { LogIn, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const HomeHeader = () => {
  const { user } = useAuth();

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* ArovaForex Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-success rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="text-2xl font-bold">
              <span className="text-foreground group-hover:text-primary transition-colors duration-300">Arova</span>
              <span className="text-primary group-hover:text-success transition-colors duration-300">Forex</span>
            </span>
          </Link>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/auth">
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 hover:bg-primary/10 transition-all duration-300"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    className="flex items-center space-x-2 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-glow"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Get Started</span>
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/dashboard">
                <Button 
                  className="flex items-center space-x-2 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
                >
                  <span>Go to Dashboard</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};