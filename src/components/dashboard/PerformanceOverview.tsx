import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface PerformanceOverviewProps {
  entries: any[];
}

export const PerformanceOverview = ({ entries }: PerformanceOverviewProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const closedEntries = entries.filter(e => e.outcome && e.outcome !== 'open');
    
    // Today
    const todayEntries = closedEntries.filter(e => {
      const date = new Date(e.entry_date);
      return date >= today;
    });
    const todayPnL = todayEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const todayWins = todayEntries.filter(e => e.outcome === 'win').length;
    const todayWinRate = todayEntries.length > 0 ? (todayWins / todayEntries.length) * 100 : 0;
    
    // Week
    const weekEntries = closedEntries.filter(e => new Date(e.entry_date) >= startOfWeek);
    const weekPnL = weekEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const weekWins = weekEntries.filter(e => e.outcome === 'win').length;
    const weekWinRate = weekEntries.length > 0 ? (weekWins / weekEntries.length) * 100 : 0;
    const weeklyGoal = 10; // Could be user-configurable
    
    // Month
    const monthEntries = closedEntries.filter(e => new Date(e.entry_date) >= startOfMonth);
    const monthPnL = monthEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const monthWins = monthEntries.filter(e => e.outcome === 'win').length;
    const monthWinRate = monthEntries.length > 0 ? (monthWins / monthEntries.length) * 100 : 0;
    
    // Goals
    const pnlGoal = 5000;
    const volumeGoal = 50;
    const winRateGoal = 70;
    
    // Today chart data
    const todayChartData = todayEntries.map((entry, idx) => ({
      time: idx + 1,
      pnl: todayEntries.slice(0, idx + 1).reduce((sum, e) => sum + (e.pnl || 0), 0)
    }));
    
    return {
      today: { trades: todayEntries.length, pnl: todayPnL, winRate: todayWinRate, chartData: todayChartData },
      week: { trades: weekEntries.length, pnl: weekPnL, winRate: weekWinRate, goal: weeklyGoal },
      month: { trades: monthEntries.length, pnl: monthPnL, winRate: monthWinRate },
      goals: { pnl: pnlGoal, volume: volumeGoal, winRate: winRateGoal }
    };
  }, [entries]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Today's Summary */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Today's Summary</CardTitle>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.today.trades}</p>
              <p className="text-xs text-muted-foreground">Trades</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${stats.today.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${Math.abs(stats.today.pnl).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">P&L</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.today.winRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
          
          {stats.today.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={stats.today.chartData}>
                <defs>
                  <linearGradient id="todayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stats.today.pnl >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={stats.today.pnl >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="pnl" stroke={stats.today.pnl >= 0 ? "#10b981" : "#ef4444"} fill="url(#todayGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-xs text-muted-foreground">
              No trades today
            </div>
          )}
          
          <Link to="/dashboard/journal">
            <Button variant="outline" size="sm" className="w-full">View Details →</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Weekly Progress</CardTitle>
          <p className="text-xs text-muted-foreground">This week's activity</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(stats.week.trades / stats.week.goal) * 352} 352`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold">{stats.week.trades}</p>
                <p className="text-xs text-muted-foreground">/ {stats.week.goal}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xl font-bold">{stats.week.winRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div>
              <p className={`text-xl font-bold ${stats.week.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${Math.abs(stats.week.pnl).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">P&L</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goals */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Monthly Goals</CardTitle>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>P&L Target</span>
                <span className="text-muted-foreground">
                  ${Math.abs(stats.month.pnl).toFixed(0)} / ${stats.goals.pnl}
                </span>
              </div>
              <Progress value={(stats.month.pnl / stats.goals.pnl) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Trade Volume</span>
                <span className="text-muted-foreground">
                  {stats.month.trades} / {stats.goals.volume}
                </span>
              </div>
              <Progress value={(stats.month.trades / stats.goals.volume) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Win Rate Target</span>
                <span className="text-muted-foreground">
                  {stats.month.winRate.toFixed(0)}% / {stats.goals.winRate}%
                </span>
              </div>
              <Progress value={(stats.month.winRate / stats.goals.winRate) * 100} className="h-2" />
            </div>
          </div>
          
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-center">
              {stats.month.pnl >= stats.goals.pnl ? (
                <span className="text-success">🎉 Goal achieved!</span>
              ) : (
                <span className="text-muted-foreground">
                  ${(stats.goals.pnl - stats.month.pnl).toFixed(0)} to goal
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
