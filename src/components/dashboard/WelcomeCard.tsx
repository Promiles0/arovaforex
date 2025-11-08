import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { UserDisplayName } from "@/components/common/UserDisplayName";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const WelcomeCard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name, telegram_handle, email')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/20 shadow-lg">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      <div className="relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-text">
          {getGreeting()}, <UserDisplayName profile={profile} userId={user?.id} />! 👋
        </h2>
        <p className="text-muted-foreground mb-6">
          Ready to analyze the markets? Check out the latest forecasts and insights.
        </p>
        <Link to="/forecasts">
          <Button className="gap-2">
            <TrendingUp className="w-4 h-4" />
            View Market Forecasts
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default WelcomeCard;
