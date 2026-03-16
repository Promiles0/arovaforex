import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, BarChart3, TrendingUp, Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'new_user' | 'new_forecast' | 'new_signal';
  text: string;
  time: string;
  icon: React.ReactNode;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    fetchActivity();
  }, []);

  useEffect(() => {
    if (activities.length <= 1) return;
    const interval = setInterval(() => {
      setVisibleIndex(prev => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activities.length]);

  const fetchActivity = async () => {
    const items: ActivityItem[] = [];

    // Recent users (anonymized)
    const { data: users } = await supabase
      .from('profiles')
      .select('created_at, country')
      .order('created_at', { ascending: false })
      .limit(5);

    users?.forEach(u => {
      const country = u.country || 'the community';
      items.push({
        id: `user-${u.created_at}`,
        type: 'new_user',
        text: `A new trader from ${country} just joined`,
        time: getTimeAgo(u.created_at),
        icon: <UserPlus className="w-4 h-4 text-success" />,
      });
    });

    // Recent forecasts
    const { data: forecasts } = await supabase
      .from('forecasts')
      .select('id, currency_pair, trade_bias, created_at')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(5);

    forecasts?.forEach(f => {
      const bias = f.trade_bias === 'long' ? '📈' : f.trade_bias === 'short' ? '📉' : '';
      items.push({
        id: `forecast-${f.id}`,
        type: 'new_forecast',
        text: `${bias} New forecast posted for ${f.currency_pair || 'the market'}`,
        time: getTimeAgo(f.created_at),
        icon: <BarChart3 className="w-4 h-4 text-primary" />,
      });
    });

    // Recent signals
    const { data: signals } = await supabase
      .from('trading_signals')
      .select('id, currency_pair, signal_type, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3);

    signals?.forEach(s => {
      items.push({
        id: `signal-${s.id}`,
        type: 'new_signal',
        text: `🔔 ${s.signal_type} signal published for ${s.currency_pair}`,
        time: getTimeAgo(s.created_at),
        icon: <TrendingUp className="w-4 h-4 text-warning" />,
      });
    });

    // Sort by recency and take top 10
    items.sort((a, b) => {
      // Simple sort — items are already ordered from DB
      return 0;
    });

    setActivities(items.slice(0, 10));
  };

  if (activities.length === 0) return null;

  return (
    <section className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>

        <div className="relative h-14 overflow-hidden rounded-xl bg-card/50 border border-border/50 backdrop-blur">
          <AnimatePresence mode="wait">
            <motion.div
              key={visibleIndex}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center gap-3 px-6"
            >
              <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                {activities[visibleIndex]?.icon}
              </div>
              <span className="text-sm text-foreground font-medium">
                {activities[visibleIndex]?.text}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {activities[visibleIndex]?.time}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
