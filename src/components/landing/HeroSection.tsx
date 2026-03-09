import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Users, TrendingUp, Activity, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  users_count: number;
  forecasts_count: number;
  active_this_month: number;
  avg_win_rate: number;
}

const ROTATING_PHRASES = [
  "AI-Powered Market Analysis",
  "Real-Time Trading Signals",
  "Professional Risk Management",
];

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

export const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [stats, setStats] = useState<PlatformStats>({
    users_count: 0,
    forecasts_count: 0,
    active_this_month: 0,
    avg_win_rate: 0,
  });
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_platform_stats');
        if (!error && data) setStats(data as unknown as PlatformStats);
      } catch (e) {
        console.error('Error fetching stats:', e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % ROTATING_PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const usersCount = useCountUp(stats.users_count);
  const forecastsCount = useCountUp(stats.forecasts_count);
  const activeCount = useCountUp(stats.active_this_month);
  const winRate = useCountUp(stats.avg_win_rate);

  const statItems = [
    { icon: Users, label: "Active Traders", value: `${usersCount}+`, color: "text-primary" },
    { icon: TrendingUp, label: "Total Forecasts", value: `${forecastsCount}`, color: "text-success" },
    { icon: Activity, label: "Active This Month", value: `${activeCount}`, color: "text-accent" },
    { icon: Award, label: "Avg. Win Rate", value: `${winRate}%`, color: "text-warning" },
  ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]"
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-success/15 rounded-full blur-[120px]"
        animate={{ x: [0, -60, 30, 0], y: [0, 50, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle Grid */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/30"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              left: `${Math.random() * 100}%`,
            }}
            initial={{ y: "110vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.8, 0.8, 0] }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 6,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        {/* Live Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
        >
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm text-foreground font-medium">
            Live · {stats.users_count}+ Active Traders
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
        >
          <span className="text-foreground">Professional</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-success to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-flow">
            Forex Trading
          </span>
          <br />
          <span className="text-foreground">Platform</span>
        </motion.h1>

        {/* Typewriter Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
          className="h-8 sm:h-10 mb-8 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-lg sm:text-xl text-muted-foreground"
            >
              {ROTATING_PHRASES[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {[
            { icon: '✓', text: 'No Credit Card Required' },
            { icon: '🎯', text: '14-Day Free Trial' },
            { icon: '⚡', text: 'Cancel Anytime' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/30 text-sm text-muted-foreground">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
        >
          <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="relative overflow-hidden group bg-gradient-to-r from-primary to-success hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-300 w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {isAuthenticated ? "Go to Dashboard" : "Start Trading Free"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Shimmer */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Button>
            </motion.div>
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-12"
        >
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Trusted by traders worldwide
        </motion.div>
      </div>

      {/* Floating Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.6 }}
        className="relative z-10 w-full max-w-4xl mx-auto px-6 mb-12"
      >
        <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {statItems.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.7 + i * 0.1 }}
                className="text-center"
              >
                <div className={`w-10 h-10 mx-auto rounded-lg bg-muted/50 flex items-center justify-center mb-2 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 bg-primary rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};
