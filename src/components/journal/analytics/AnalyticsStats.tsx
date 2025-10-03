import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, BarChart3, Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnalyticsMetrics } from '@/hooks/useJournalAnalytics';

interface AnalyticsStatsProps {
  metrics: AnalyticsMetrics;
}

export default function AnalyticsStats({ metrics }: AnalyticsStatsProps) {
  // Priority order: Total P&L, Win Rate, Total Trades, Risk/Reward
  const statCards = [
    {
      title: 'Total P&L',
      value: metrics.totalPnL >= 0 ? `+$${metrics.totalPnL.toFixed(2)}` : `-$${Math.abs(metrics.totalPnL).toFixed(2)}`,
      icon: metrics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      subtitle: `Avg: ${metrics.averagePnL >= 0 ? '+' : ''}$${metrics.averagePnL.toFixed(2)}`,
      color: metrics.totalPnL >= 0 ? 'text-bull' : 'text-bear',
      bgColor: metrics.totalPnL >= 0 ? 'bg-bull/10' : 'bg-bear/10',
      delay: 0,
      type: 'pnl'
    },
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      icon: Target,
      subtitle: `${metrics.winningTrades} wins / ${metrics.totalTrades} trades`,
      color: metrics.winRate >= 60 ? 'text-bull' : metrics.winRate >= 40 ? 'text-yellow-500' : 'text-bear',
      bgColor: metrics.winRate >= 60 ? 'bg-bull/10' : metrics.winRate >= 40 ? 'bg-yellow-500/10' : 'bg-bear/10',
      progress: metrics.winRate,
      delay: 0.1,
      type: 'winrate'
    },
    {
      title: 'Total Trades',
      value: metrics.totalTrades.toString(),
      icon: BarChart3,
      subtitle: `${metrics.winningTrades}W • ${metrics.losingTrades}L • ${metrics.breakevenTrades}BE`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      delay: 0.2,
      type: 'trades'
    },
    {
      title: 'Risk/Reward Ratio',
      value: `1:${metrics.averageRiskReward.toFixed(2)}`,
      icon: BarChart3,
      subtitle: metrics.averageRiskReward >= 2 ? 'Excellent' : metrics.averageRiskReward >= 1 ? 'Good' : 'Needs improvement',
      color: metrics.averageRiskReward >= 2 ? 'text-bull' : metrics.averageRiskReward >= 1 ? 'text-yellow-500' : 'text-bear',
      bgColor: metrics.averageRiskReward >= 2 ? 'bg-bull/10' : metrics.averageRiskReward >= 1 ? 'bg-yellow-500/10' : 'bg-bear/10',
      delay: 0.3,
      type: 'rr'
    }
  ];

  const formatHoldTime = (minutes: number) => {
    if (minutes >= 1440) return `${(minutes / 1440).toFixed(1)} days`;
    if (minutes >= 60) return `${(minutes / 60).toFixed(1)} hours`;
    return `${minutes.toFixed(0)} min`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
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
          <Card className="journal-glassmorphism overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] min-h-[140px]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{stat.title}</p>
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

              {/* Sparkline for P&L */}
              {stat.type === 'pnl' && metrics.pnlByDate.length > 0 && (
                <div className="mt-4 h-8 flex items-end justify-between gap-1">
                  {metrics.pnlByDate.slice(-10).map((day, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "flex-1 rounded-t min-w-[2px]",
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

              {/* Circular progress for Win Rate */}
              {stat.type === 'winrate' && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-muted/20"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        className={stat.color}
                        initial={{ strokeDasharray: "0 175.93" }}
                        animate={{ strokeDasharray: `${(stat.progress! / 100) * 175.93} 175.93` }}
                        transition={{ delay: stat.delay + 0.4, duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Donut chart for Total Trades */}
              {stat.type === 'trades' && metrics.totalTrades > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden flex">
                    <motion.div
                      className="bg-bull h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(metrics.winningTrades / metrics.totalTrades) * 100}%` }}
                      transition={{ delay: stat.delay + 0.4, duration: 0.8, ease: "easeOut" }}
                    />
                    <motion.div
                      className="bg-bear h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(metrics.losingTrades / metrics.totalTrades) * 100}%` }}
                      transition={{ delay: stat.delay + 0.5, duration: 0.8, ease: "easeOut" }}
                    />
                    <motion.div
                      className="bg-yellow-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(metrics.breakevenTrades / metrics.totalTrades) * 100}%` }}
                      transition={{ delay: stat.delay + 0.6, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              {/* Horizontal bar for Risk/Reward */}
              {stat.type === 'rr' && (
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">1:1</span>
                    <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", stat.color.replace('text-', 'bg-'))}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((metrics.averageRiskReward / 3) * 100, 100)}%` }}
                        transition={{ delay: stat.delay + 0.4, duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12">1:3</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
