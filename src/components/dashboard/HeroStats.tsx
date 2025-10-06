import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";

interface HeroStatsProps {
  entries: any[];
}

export const HeroStats = ({ entries }: HeroStatsProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const closedEntries = entries.filter(e => e.outcome && e.outcome !== 'open');
    
    // This week entries
    const thisWeek = closedEntries.filter(e => new Date(e.entry_date) >= startOfWeek);
    const lastWeek = closedEntries.filter(e => {
      const date = new Date(e.entry_date);
      return date >= lastWeekStart && date < startOfWeek;
    });
    
    // Win rate
    const wins = closedEntries.filter(e => e.outcome === 'win').length;
    const winRate = closedEntries.length > 0 ? (wins / closedEntries.length) * 100 : 0;
    const lastMonthWins = closedEntries.filter(e => {
      const date = new Date(e.entry_date);
      return date < startOfMonth;
    }).filter(e => e.outcome === 'win').length;
    const lastMonthTotal = closedEntries.filter(e => new Date(e.entry_date) < startOfMonth).length;
    const lastMonthWinRate = lastMonthTotal > 0 ? (lastMonthWins / lastMonthTotal) * 100 : 0;
    const winRateChange = winRate - lastMonthWinRate;
    
    // Month P&L
    const monthEntries = closedEntries.filter(e => new Date(e.entry_date) >= startOfMonth);
    const monthPnL = monthEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const lastMonth = closedEntries.filter(e => {
      const date = new Date(e.entry_date);
      const lastMonthStart = new Date(startOfMonth);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      return date >= lastMonthStart && date < startOfMonth;
    });
    const lastMonthPnL = lastMonth.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const pnlChangePercent = lastMonthPnL !== 0 ? ((monthPnL - lastMonthPnL) / Math.abs(lastMonthPnL)) * 100 : 0;
    
    // Streak
    const sorted = [...closedEntries].sort((a, b) => 
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );
    let streak = 0;
    let streakType = sorted[0]?.outcome || 'win';
    for (const entry of sorted) {
      if (entry.outcome === streakType) {
        streak++;
      } else {
        break;
      }
    }
    const bestStreak = Math.max(...Array.from({ length: closedEntries.length }, (_, i) => {
      let count = 0;
      let type = closedEntries[i]?.outcome;
      for (let j = i; j < closedEntries.length && closedEntries[j]?.outcome === type; j++) {
        count++;
      }
      return count;
    }));
    
    return {
      winRate: winRate.toFixed(1),
      winRateChange: winRateChange.toFixed(1),
      thisWeekTrades: thisWeek.length,
      weekChange: thisWeek.length - lastWeek.length,
      monthPnL,
      pnlChangePercent: pnlChangePercent.toFixed(1),
      streak,
      streakType,
      bestStreak
    };
  }, [entries]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Win Rate */}
      <Card className="p-4 border-border/50 bg-gradient-to-br from-success/5 to-transparent hover:shadow-lg transition-all">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="text-3xl font-bold text-success">{stats.winRate}%</p>
          <div className="flex items-center gap-1 text-xs">
            {parseFloat(stats.winRateChange) >= 0 ? (
              <ArrowUp className="w-3 h-3 text-success" />
            ) : (
              <ArrowDown className="w-3 h-3 text-destructive" />
            )}
            <span className={parseFloat(stats.winRateChange) >= 0 ? 'text-success' : 'text-destructive'}>
              {Math.abs(parseFloat(stats.winRateChange))}% vs last month
            </span>
          </div>
        </div>
      </Card>

      {/* This Week */}
      <Card className="p-4 border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">This Week</p>
          <p className="text-3xl font-bold">{stats.thisWeekTrades}</p>
          <p className="text-xs text-muted-foreground">trades</p>
          <div className="flex items-center gap-1 text-xs">
            {stats.weekChange >= 0 ? (
              <ArrowUp className="w-3 h-3 text-success" />
            ) : (
              <ArrowDown className="w-3 h-3 text-destructive" />
            )}
            <span className={stats.weekChange >= 0 ? 'text-success' : 'text-destructive'}>
              {Math.abs(stats.weekChange)} vs last week
            </span>
          </div>
        </div>
      </Card>

      {/* P&L Month-to-Date */}
      <Card className="p-4 border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">P&L MTD</p>
          <p className={`text-3xl font-bold ${stats.monthPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${Math.abs(stats.monthPnL).toFixed(0)}
          </p>
          <div className="flex items-center gap-1 text-xs">
            {parseFloat(stats.pnlChangePercent) >= 0 ? (
              <ArrowUp className="w-3 h-3 text-success" />
            ) : (
              <ArrowDown className="w-3 h-3 text-destructive" />
            )}
            <span className={parseFloat(stats.pnlChangePercent) >= 0 ? 'text-success' : 'text-destructive'}>
              {Math.abs(parseFloat(stats.pnlChangePercent))}% vs last month
            </span>
          </div>
        </div>
      </Card>

      {/* Active Streak */}
      <Card className="p-4 border-border/50 bg-gradient-to-br from-premium/5 to-transparent hover:shadow-lg transition-all">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Current Streak</p>
          <p className="text-3xl font-bold text-premium">{stats.streak}</p>
          <p className="text-xs text-muted-foreground capitalize">{stats.streakType}s</p>
          <p className="text-xs text-muted-foreground">
            Best: {stats.bestStreak} wins
          </p>
        </div>
      </Card>
    </div>
  );
};
