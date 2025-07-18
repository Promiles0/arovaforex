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
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-green/10 via-brand-green/5 to-transparent rounded-xl p-6 border border-brand-green/20 animate-fade-in">
      {/* Background animation elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-green/5 rounded-full animate-pulse" />
        <div className="absolute top-1/2 -left-8 w-16 h-16 bg-brand-green/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/3 w-12 h-12 bg-brand-green/5 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              {getGreeting()}, {getUserName()} 
              <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-muted-foreground max-w-md">
              Ready to explore today's market opportunities? Check out the latest forecasts and signals.
            </p>
            <div className="flex items-center text-sm text-brand-green/80 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <TrendingUp className="w-4 h-4 mr-1" />
              Market is active • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard/forecasts">
              <Button 
                variant="outline" 
                className="border-brand-green/30 hover:border-brand-green hover:bg-brand-green/10 transition-all duration-300 hover:scale-105"
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