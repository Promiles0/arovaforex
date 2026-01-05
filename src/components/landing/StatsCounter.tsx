import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Activity, Award } from "lucide-react";

interface Stat {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

interface PlatformStats {
  users_count: number;
  forecasts_count: number;
  active_this_month: number;
  avg_win_rate: number;
}

export const StatsCounter = () => {
  const [stats, setStats] = useState<Stat[]>([
    { icon: <Users className="w-8 h-8" />, value: 0, suffix: "+", label: "Active Traders", color: "text-primary" },
    { icon: <TrendingUp className="w-8 h-8" />, value: 0, suffix: "", label: "Total Forecasts", color: "text-success" },
    { icon: <Activity className="w-8 h-8" />, value: 0, suffix: "", label: "Active This Month", color: "text-premium" },
    { icon: <Award className="w-8 h-8" />, value: 0, suffix: "%", label: "Avg. Win Rate", color: "text-warning" }
  ]);
  
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use the database function that bypasses RLS for aggregate counts
        const { data, error } = await supabase.rpc('get_platform_stats');

        if (error) {
          console.error('Error fetching platform stats:', error);
          return;
        }

        const platformStats = data as unknown as PlatformStats;

        setStats([
          { icon: <Users className="w-8 h-8" />, value: platformStats.users_count || 0, suffix: "+", label: "Active Traders", color: "text-primary" },
          { icon: <TrendingUp className="w-8 h-8" />, value: platformStats.forecasts_count || 0, suffix: "", label: "Total Forecasts", color: "text-success" },
          { icon: <Activity className="w-8 h-8" />, value: platformStats.active_this_month || 0, suffix: "", label: "Active This Month", color: "text-premium" },
          { icon: <Award className="w-8 h-8" />, value: platformStats.avg_win_rate || 0, suffix: "%", label: "Avg. Win Rate", color: "text-warning" }
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={ref} className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-success/10 mb-4 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-4xl font-bold mb-2">
                <CounterAnimation value={stat.value} suffix={stat.suffix} isInView={isInView} />
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CounterAnimation = ({ value, suffix, isInView }: { value: number; suffix: string; isInView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const duration = 2000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return <>{count.toLocaleString()}{suffix}</>;
};
