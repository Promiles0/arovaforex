import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Signal } from "lucide-react";

interface LiveStats {
  activeSignals: number;
  weeklyWinRate: number;
  totalSubscribers: number;
}

export const SignalsHero = () => {
  const [liveStats] = useState<LiveStats>({
    activeSignals: 12,
    weeklyWinRate: 72,
    totalSubscribers: 547,
  });

  const [displayedStats, setDisplayedStats] = useState({
    activeSignals: 0,
    weeklyWinRate: 0,
    totalSubscribers: 0,
  });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);

      setDisplayedStats({
        activeSignals: Math.round(liveStats.activeSignals * easeOutQuad),
        weeklyWinRate: Math.round(liveStats.weeklyWinRate * easeOutQuad),
        totalSubscribers: Math.round(liveStats.totalSubscribers * easeOutQuad),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [liveStats]);

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    pricingSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/10 rounded-3xl p-8 lg:p-12 mb-8 border border-border/50"
    >
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.05) 1px, transparent 1px), 
                             linear-gradient(90deg, hsl(var(--primary) / 0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-success/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Live Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-full mb-6"
        >
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm text-success font-medium">
            {displayedStats.activeSignals} Active Signals This Week
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4"
        >
          <Signal className="inline-block w-10 h-10 lg:w-12 lg:h-12 text-premium mr-3 -mt-2" />
          Premium Trading Signals
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
        >
          Exclusive trading signals with detailed entry, stop loss, and take profit levels. 
          Our professional analysts provide high-probability setups with detailed market analysis.
        </motion.p>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 max-w-3xl mx-auto mb-8"
        >
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-border/50">
            <div className="text-3xl lg:text-4xl font-bold text-success mb-2">
              {displayedStats.weeklyWinRate}%
            </div>
            <div className="text-sm text-muted-foreground">Win Rate (30d)</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-border/50">
            <div className="text-3xl lg:text-4xl font-bold text-success mb-2">
              {displayedStats.totalSubscribers}+
            </div>
            <div className="text-sm text-muted-foreground">Active Subscribers</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-border/50">
            <div className="text-3xl lg:text-4xl font-bold text-success mb-2">
              24/7
            </div>
            <div className="text-sm text-muted-foreground">Signal Delivery</div>
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={scrollToPricing}
          className="px-8 py-4 bg-gradient-to-r from-primary to-success text-primary-foreground font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-primary/30"
        >
          Unlock Premium Signals Now →
        </motion.button>
      </div>
    </motion.div>
  );
};
