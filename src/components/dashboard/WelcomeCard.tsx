import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight } from "lucide-react";

export const WelcomeCard = () => {
  const { user } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Trader";
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border border-primary/20 shadow-brand animate-fade-in">
      {/* Top brand accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand" />
      
      {/* Background animation elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full animate-pulse" />
        <div className="absolute top-1/2 -left-8 w-16 h-16 bg-primary/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/3 w-12 h-12 bg-primary/5 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              {getGreeting()}, {getUserName()} 
              <span className="animate-bounce">👋💲</span>
            </h1>
            <p className="text-muted-foreground max-w-md">
              Ready to explore today's market opportunities? Check out the latest forecasts and signals.
            </p>
            <div className="flex items-center text-sm text-primary/80 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <TrendingUp className="w-4 h-4 mr-1 text-primary" />
              Market is active • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard/forecasts">
              <Button 
                variant="brand" 
                className="transition-all duration-300 hover:scale-105 shadow-brand"
              >
                View Today's Forecasts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
