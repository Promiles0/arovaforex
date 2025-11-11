import { useMemo, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Target, BarChart3, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useRef } from 'react';

type TimePeriod = 'today' | 'week' | 'month';

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
  const [period, setPeriod] = useState<TimePeriod>('today');

  const { currentStats, previousStats, percentageChanges } = useMemo(() => {
    const now = new Date();
    const getDateRange = (periodType: TimePeriod, offset = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() + offset);
      
      switch (periodType) {
        case 'today':
          return {
            start: date.toISOString().split('T')[0],
            end: date.toISOString().split('T')[0]
          };
        case 'week': {
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay() + offset);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return {
            start: startOfWeek.toISOString().split('T')[0],
            end: endOfWeek.toISOString().split('T')[0]
          };
        }
        case 'month': {
          const startOfMonth = new Date(date.getFullYear(), date.getMonth() + (offset / 30), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + (offset / 30) + 1, 0);
          return {
            start: startOfMonth.toISOString().split('T')[0],
            end: endOfMonth.toISOString().split('T')[0]
          };
        }
      }
    };

    const calculateStats = (startDate: string, endDate: string) => {
      const periodEntries = entries.filter(entry => 
        entry.entry_date >= startDate && 
        entry.entry_date <= endDate && 
        !entry.is_draft
      );

      const totalTrades = periodEntries.length;
      const wonTrades = periodEntries.filter(entry => 
        entry.pnl && parseFloat(entry.pnl as string) > 0
      ).length;
      const winRate = totalTrades > 0 ? (wonTrades / totalTrades) * 100 : 0;
      
      const pnl = periodEntries.reduce((sum, entry) => {
        const entryPnl = parseFloat(entry.pnl as string) || 0;
        return sum + entryPnl;
      }, 0);

      return { pnl, winRate, totalTrades, isProfitable: pnl > 0 };
    };

    const currentRange = getDateRange(period, 0);
    const previousOffset = period === 'today' ? -7 : period === 'week' ? -7 : -30;
    const previousRange = getDateRange(period, previousOffset);

    const current = calculateStats(currentRange.start, currentRange.end);
    const previous = calculateStats(previousRange.start, previousRange.end);

    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    return {
      currentStats: current,
      previousStats: previous,
      percentageChanges: {
        pnl: calculatePercentageChange(current.pnl, previous.pnl),
        winRate: calculatePercentageChange(current.winRate, previous.winRate),
        totalTrades: calculatePercentageChange(current.totalTrades, previous.totalTrades)
      }
    };
  }, [entries, period]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return "Today's";
      case 'week': return "This Week's";
      case 'month': return "This Month's";
    }
  };

  const stats = [
    {
      label: `${getPeriodLabel()} P&L`,
      value: Math.abs(currentStats.pnl),
      prefix: currentStats.pnl >= 0 ? '+$' : '-$',
      suffix: '',
      decimals: 2,
      icon: TrendingUp,
      color: currentStats.isProfitable ? 'text-success' : 'text-destructive',
      bgColor: currentStats.isProfitable ? 'bg-success/10' : 'bg-destructive/10',
      borderColor: currentStats.isProfitable ? 'border-success/20' : 'border-destructive/20',
      change: percentageChanges.pnl,
    },
    {
      label: 'Win Rate',
      value: currentStats.winRate,
      prefix: '',
      suffix: '%',
      decimals: 1,
      icon: Target,
      color: currentStats.winRate >= 50 ? 'text-success' : 'text-muted-foreground',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      change: percentageChanges.winRate,
    },
    {
      label: 'Total Trades',
      value: currentStats.totalTrades,
      prefix: '',
      suffix: '',
      decimals: 0,
      icon: BarChart3,
      color: 'text-foreground',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
      change: percentageChanges.totalTrades,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Time Period Filter */}
      <div className="flex justify-center gap-2">
        {(['today', 'week', 'month'] as TimePeriod[]).map((p) => (
          <motion.button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </motion.button>
        ))}
      </div>

      {/* Stats Grid */}
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
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block">
                      {stat.label}
                    </span>
                    {/* Week-over-week comparison */}
                    <div className="flex items-center gap-1 mt-1">
                      {stat.change >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-destructive" />
                      )}
                      <span className={`text-xs font-medium ${
                        stat.change >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        vs last {period === 'today' ? 'week' : period === 'week' ? 'week' : 'month'}
                      </span>
                    </div>
                  </div>
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
    </div>
  );
};
