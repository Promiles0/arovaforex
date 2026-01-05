import { Button } from "@/components/ui/button";
import { Zap, Play, TrendingUp, Users, Activity, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  users_count: number;
  forecasts_count: number;
  active_this_month: number;
  avg_win_rate: number;
}

export const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [stats, setStats] = useState<PlatformStats>({
    users_count: 0,
    forecasts_count: 0,
    active_this_month: 0,
    avg_win_rate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_platform_stats');
        if (!error && data) {
          setStats(data as unknown as PlatformStats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background" />
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-success/20 rounded-full blur-[100px]"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            initial={{
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
              y: typeof window !== 'undefined' ? window.innerHeight + 50 : 0,
              opacity: 0
            }}
            animate={{
              y: -50,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm text-foreground font-medium">
                Join {stats.users_count}+ Active Traders
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              <span className="text-foreground">Professional</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-success to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-flow">
                Forex Trading
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Master the Markets with AI-Powered Insights, Real-Time Analysis, and Expert Trading Signals
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8"
            >
              {[
                { icon: '✓', text: 'No Credit Card Required' },
                { icon: '🎯', text: '14-Day Free Trial' },
                { icon: '⚡', text: 'Cancel Anytime' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground"
                >
                  <span>{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
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
                    <div className="absolute inset-0 bg-gradient-to-r from-success to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center justify-center lg:justify-start gap-4 mt-8"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-success/20 border-2 border-background flex items-center justify-center text-xs font-medium text-primary"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-warning fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Trusted by traders worldwide</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stats Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-success/20 rounded-3xl blur-3xl" />
            
            {/* Stats Card */}
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Platform Stats</h3>
                <div className="flex items-center gap-2 text-xs text-success">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  Live
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Active Traders */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.users_count}+</div>
                  <p className="text-xs text-muted-foreground">Active Traders</p>
                </div>

                {/* Total Forecasts */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.forecasts_count}</div>
                  <p className="text-xs text-muted-foreground">Total Forecasts</p>
                </div>

                {/* Active This Month */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                  <div className="w-10 h-10 rounded-lg bg-premium/10 flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5 text-premium" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.active_this_month}</div>
                  <p className="text-xs text-muted-foreground">Active This Month</p>
                </div>

                {/* Avg Win Rate */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                    <Award className="w-5 h-5 text-warning" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.avg_win_rate}%</div>
                  <p className="text-xs text-muted-foreground">Avg. Win Rate</p>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="bg-muted/20 rounded-xl p-4 border border-border/30">
                <div className="flex items-end gap-1 h-16 mb-2">
                  {[40, 65, 50, 80, 70, 90, 75, 85, 95, 100].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-success rounded-sm"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Growth Trend</span>
                  <span className="flex items-center gap-1 text-xs text-success">
                    <TrendingUp className="w-3 h-3" />
                    +24% this month
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              className="absolute -top-4 -right-4 bg-success/20 backdrop-blur-md px-4 py-2 rounded-lg border border-success/30"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-success text-sm font-semibold">+$1,234.56 ↑</div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 bg-primary/20 backdrop-blur-md px-4 py-2 rounded-lg border border-primary/30"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
              <div className="text-primary text-sm font-semibold">🎯 New Signal</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

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
