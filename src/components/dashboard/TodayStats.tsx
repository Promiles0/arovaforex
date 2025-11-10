import { useMemo, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useRef } from 'react';

interface TodayStatsProps {
  entries: any[];
}

const CounterAnimation = ({ 
  value, 
  prefix = '', 
  suffix = '',
  decimals = 0 
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string;
  decimals?: number;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isInView]);

  return (
    <span ref={ref}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
};

export const TodayStats = ({ entries }: TodayStatsProps) => {
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter(entry => 
      entry.entry_date === today && !entry.is_draft
    );

    const totalTrades = todayEntries.length;
    const wonTrades = todayEntries.filter(entry => 
      entry.pnl && parseFloat(entry.pnl as string) > 0
    ).length;
    const winRate = totalTrades > 0 ? (wonTrades / totalTrades) * 100 : 0;
    
    const todayPnL = todayEntries.reduce((sum, entry) => {
      const pnl = parseFloat(entry.pnl as string) || 0;
      return sum + pnl;
    }, 0);

    return {
      pnl: todayPnL,
      winRate,
      totalTrades,
      isProfitable: todayPnL > 0
    };
  }, [entries]);

  const stats = [
    {
      label: "Today's P&L",
      value: Math.abs(todayStats.pnl),
      prefix: todayStats.pnl >= 0 ? '+$' : '-$',
      suffix: '',
      decimals: 2,
      icon: TrendingUp,
      color: todayStats.isProfitable ? 'text-success' : 'text-destructive',
      bgColor: todayStats.isProfitable ? 'bg-success/10' : 'bg-destructive/10',
      borderColor: todayStats.isProfitable ? 'border-success/20' : 'border-destructive/20',
    },
    {
      label: 'Win Rate',
      value: todayStats.winRate,
      prefix: '',
      suffix: '%',
      decimals: 1,
      icon: Target,
      color: todayStats.winRate >= 50 ? 'text-success' : 'text-muted-foreground',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
    },
    {
      label: 'Total Trades',
      value: todayStats.totalTrades,
      prefix: '',
      suffix: '',
      decimals: 0,
      icon: BarChart3,
      color: 'text-foreground',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card className={`relative overflow-hidden border ${stat.borderColor} ${stat.bgColor}`}>
            {/* Animated gradient background */}
            <div className="absolute inset-0 opacity-30">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </div>

            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`p-2.5 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </motion.div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </div>

                {/* Sparkle effect */}
                <motion.div
                  className={`w-2 h-2 rounded-full ${stat.color}`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              <motion.div
                className={`text-3xl font-bold ${stat.color}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
              >
                <CounterAnimation
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </motion.div>

              {/* Bottom accent line */}
              <motion.div
                className={`mt-4 h-1 rounded-full ${stat.bgColor}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.6 }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
