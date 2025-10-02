import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, BarChart3, Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnalyticsMetrics } from '@/hooks/useJournalAnalytics';

interface AnalyticsStatsProps {
  metrics: AnalyticsMetrics;
}

export default function AnalyticsStats({ metrics }: AnalyticsStatsProps) {
  const statCards = [
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      icon: Target,
      subtitle: `${metrics.winningTrades}W / ${metrics.losingTrades}L`,
      color: metrics.winRate >= 60 ? 'text-bull' : metrics.winRate >= 40 ? 'text-yellow-500' : 'text-bear',
      bgColor: metrics.winRate >= 60 ? 'bg-bull/10' : metrics.winRate >= 40 ? 'bg-yellow-500/10' : 'bg-bear/10',
      progress: metrics.winRate,
      delay: 0
    },
    {
      title: 'Total P&L',
      value: metrics.totalPnL >= 0 ? `+$${metrics.totalPnL.toFixed(2)}` : `-$${Math.abs(metrics.totalPnL).toFixed(2)}`,
      icon: metrics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      subtitle: `Avg: ${metrics.averagePnL >= 0 ? '+' : ''}$${metrics.averagePnL.toFixed(2)}`,
      color: metrics.totalPnL >= 0 ? 'text-bull' : 'text-bear',
      bgColor: metrics.totalPnL >= 0 ? 'bg-bull/10' : 'bg-bear/10',
      delay: 0.1
    },
    {
      title: 'Risk/Reward',
      value: `1:${metrics.averageRiskReward.toFixed(2)}`,
      icon: BarChart3,
      subtitle: metrics.averageRiskReward >= 2 ? 'Excellent' : metrics.averageRiskReward >= 1 ? 'Good' : 'Needs Work',
      color: metrics.averageRiskReward >= 2 ? 'text-bull' : metrics.averageRiskReward >= 1 ? 'text-yellow-500' : 'text-bear',
      bgColor: metrics.averageRiskReward >= 2 ? 'bg-bull/10' : metrics.averageRiskReward >= 1 ? 'bg-yellow-500/10' : 'bg-bear/10',
      delay: 0.2
    },
    {
      title: 'Total Trades',
      value: metrics.totalTrades.toString(),
      icon: BarChart3,
      subtitle: `${metrics.openTrades} open`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      delay: 0.3
    },
    {
      title: 'Avg Hold Time',
      value: metrics.averageHoldTime >= 60 
        ? `${(metrics.averageHoldTime / 60).toFixed(1)}h`
        : `${metrics.averageHoldTime.toFixed(0)}m`,
      icon: Clock,
      subtitle: 'Per trade',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      delay: 0.4
    },
    {
      title: 'Best Day',
      value: metrics.bestDay ? new Date(metrics.bestDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
      icon: Calendar,
      subtitle: metrics.pnlByDate.find(d => d.date === metrics.bestDay)?.pnl.toFixed(2) || '0',
      color: 'text-bull',
      bgColor: 'bg-bull/10',
      delay: 0.5
    }
  ];

  const formatHoldTime = (minutes: number) => {
    if (minutes >= 1440) return `${(minutes / 1440).toFixed(1)} days`;
    if (minutes >= 60) return `${(minutes / 60).toFixed(1)} hours`;
    return `${minutes.toFixed(0)} min`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: stat.delay,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <Card className="journal-glassmorphism overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <motion.h3 
                    className={cn("text-3xl font-bold", stat.color)}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: stat.delay + 0.2, duration: 0.3 }}
                  >
                    {stat.value}
                  </motion.h3>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={cn("p-3 rounded-lg", stat.bgColor)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>

              {/* Progress bar for win rate */}
              {stat.title === 'Win Rate' && (
                <div className="mt-4">
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", stat.color.replace('text-', 'bg-'))}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ delay: stat.delay + 0.4, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              {/* Sparkline for P&L */}
              {stat.title === 'Total P&L' && metrics.pnlByDate.length > 0 && (
                <div className="mt-4 h-8 flex items-end justify-between gap-1">
                  {metrics.pnlByDate.slice(-10).map((day, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "flex-1 rounded-t",
                        day.pnl >= 0 ? "bg-bull/50" : "bg-bear/50"
                      )}
                      initial={{ height: 0 }}
                      animate={{ 
                        height: `${Math.abs(day.pnl) / Math.max(...metrics.pnlByDate.map(d => Math.abs(d.pnl))) * 100}%` 
                      }}
                      transition={{ delay: stat.delay + 0.4 + (i * 0.05), duration: 0.3 }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
