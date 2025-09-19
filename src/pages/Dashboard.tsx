import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Signal, Wallet, BookOpen, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [latestForecast, setLatestForecast] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestForecast();
    fetchRecentActivity();
    
    // Real-time subscriptions
    const notificationsChannel = supabase
      .channel('dashboard-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        () => fetchRecentActivity()
      )
      .subscribe();

    const forecastsChannel = supabase
      .channel('dashboard-forecasts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forecasts'
        },
        () => fetchLatestForecast()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(forecastsChannel);
    };
  }, [user?.id]);

  const fetchLatestForecast = async () => {
    try {
      const { data: forecast, error } = await supabase
        .from('forecasts')
        .select(`
          *,
          profiles!forecasts_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setLatestForecast(forecast);
    } catch (error) {
      console.error('Error fetching latest forecast:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      if (!user?.id) return;

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivity(notifications || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'success';
      case 'comment':
        return 'primary';
      case 'bookmark':
        return 'premium';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <WelcomeCard />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-4">
        <Link to="/dashboard/academy" className="block">
          <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer group">
            <CardHeader className="pb-2 p-3 xs:p-4 sm:p-6">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                <BookOpen className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-premium flex-shrink-0" />
                <span className="truncate">Academy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
              <p className="text-xs xs:text-sm text-muted-foreground hidden sm:block">Access premium courses</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/journal" className="block">
          <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer group">
            <CardHeader className="pb-2 p-3 xs:p-4 sm:p-6">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium group-hover:text-primary transition-colors">
                <span className="truncate">My Journal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
              <p className="text-xs xs:text-sm text-muted-foreground hidden sm:block">Track trades & reflection</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/support" className="block">
          <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer group">
            <CardHeader className="pb-2 p-3 xs:p-4 sm:p-6">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium group-hover:text-primary transition-colors">
                <span className="truncate">Support</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
              <p className="text-xs xs:text-sm text-muted-foreground hidden sm:block">Get help when you need it</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/wallet" className="block">
          <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer group">
            <CardHeader className="pb-2 p-3 xs:p-4 sm:p-6">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                <Wallet className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <span className="truncate">Wallet</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
              <p className="text-xs xs:text-sm text-muted-foreground hidden sm:block">Manage subscription</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/calendar" className="block col-span-2 xs:col-span-1">
          <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer group">
            <CardHeader className="pb-2 p-3 xs:p-4 sm:p-6">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium group-hover:text-primary transition-colors">
                <span className="truncate">Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
              <p className="text-xs xs:text-sm text-muted-foreground hidden sm:block">Trading events & news</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
        {/* Latest Forecast */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 xs:pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base xs:text-lg sm:text-xl">
              <TrendingUp className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-success flex-shrink-0" />
              Latest Forecast
            </CardTitle>
            <CardDescription className="text-xs xs:text-sm sm:text-base">Free analysis for all members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 xs:space-y-4 sm:space-y-5">
            {latestForecast ? (
              <>
                <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border border-border/50 overflow-hidden">
                  {latestForecast.image_url ? (
                    <img 
                      src={latestForecast.image_url} 
                      alt={latestForecast.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <p className="text-muted-foreground text-xs xs:text-sm sm:text-base">No chart available</p>
                  )}
                </div>
                <div className="flex items-start xs:items-center justify-between flex-col xs:flex-row gap-2 xs:gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm xs:text-base sm:text-lg truncate">
                      {latestForecast.title || `${latestForecast.currency_pair} Analysis`}
                    </p>
                    <p className="text-xs xs:text-sm text-muted-foreground">
                      Posted {formatDistanceToNow(new Date(latestForecast.created_at), { addSuffix: true })}
                    </p>
                    {latestForecast.profiles?.full_name && (
                      <p className="text-xs xs:text-sm text-muted-foreground">by {latestForecast.profiles.full_name}</p>
                    )}
                  </div>
                  <Link to="/dashboard/forecasts" className="flex-shrink-0">
                    <Button variant="outline" size="sm" className="text-xs xs:text-sm whitespace-nowrap">
                      View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-6 xs:py-8">
                <p className="text-muted-foreground text-xs xs:text-sm sm:text-base">No forecasts available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Signals */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 xs:pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base xs:text-lg sm:text-xl">
              <Signal className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-premium flex-shrink-0" />
              Premium Signals
            </CardTitle>
            <CardDescription className="text-xs xs:text-sm sm:text-base">Exclusive trading signals for premium members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 xs:space-y-4 sm:space-y-5">
            <div className="p-4 xs:p-5 sm:p-6 border border-border/50 rounded-lg bg-muted/20 text-center">
              <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-premium/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Signal className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-premium" />
              </div>
              <p className="font-medium mb-2 text-sm xs:text-base sm:text-lg">Upgrade to Premium</p>
              <p className="text-xs xs:text-sm sm:text-base text-muted-foreground mb-4">
                Get access to exclusive trading signals with entry, SL, and TP levels.
              </p>
              <Link to="/dashboard/wallet">
                <Button className="bg-premium hover:bg-premium/90 text-premium-foreground text-xs xs:text-sm sm:text-base" size="sm">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 xs:pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base xs:text-lg sm:text-xl">
            <Bell className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 xs:space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-2 xs:gap-3 p-2 xs:p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className={`w-2 h-2 xs:w-3 xs:h-3 rounded-full flex-shrink-0 bg-${getActivityIcon(activity.type)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs xs:text-sm sm:text-base font-medium truncate">{activity.content}</p>
                    <p className="text-xs xs:text-sm text-muted-foreground truncate">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 xs:py-6">
                <p className="text-xs xs:text-sm sm:text-base text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}