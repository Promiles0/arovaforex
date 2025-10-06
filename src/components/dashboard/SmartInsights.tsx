import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface SmartInsightsProps {
  entries: any[];
}

export const SmartInsights = ({ entries }: SmartInsightsProps) => {
  const navigate = useNavigate();
  
  const insights = useMemo(() => {
    const closedEntries = entries.filter(e => e.outcome && e.outcome !== 'open');
    const results: any[] = [];
    
    if (closedEntries.length === 0) {
      return [{
        type: 'info',
        icon: TrendingUp,
        text: 'Start tracking trades to see personalized insights',
        action: () => navigate('/dashboard/journal'),
        actionLabel: 'Create Entry'
      }];
    }
    
    // 1. Best performing instrument
    const instrumentStats: Record<string, { wins: number; total: number; pnl: number }> = {};
    closedEntries.forEach(entry => {
      if (entry.instrument) {
        if (!instrumentStats[entry.instrument]) {
          instrumentStats[entry.instrument] = { wins: 0, total: 0, pnl: 0 };
        }
        instrumentStats[entry.instrument].total++;
        if (entry.outcome === 'win') {
          instrumentStats[entry.instrument].wins++;
        }
        instrumentStats[entry.instrument].pnl += entry.pnl || 0;
      }
    });
    
    const bestInstrument = Object.entries(instrumentStats)
      .filter(([_, stats]) => stats.total >= 5)
      .map(([symbol, stats]) => ({
        symbol,
        winRate: (stats.wins / stats.total * 100).toFixed(1),
        trades: stats.total
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0];
    
    if (bestInstrument) {
      results.push({
        type: 'success',
        icon: CheckCircle,
        text: `Best pair: ${bestInstrument.symbol} with ${bestInstrument.winRate}% win rate`,
        action: () => navigate('/dashboard/journal'),
        actionLabel: 'Analyze'
      });
    }
    
    // 2. Best trading time
    const hourStats: Record<number, { wins: number; total: number }> = {};
    closedEntries.forEach(entry => {
      const hour = new Date(entry.entry_date).getHours();
      if (!hourStats[hour]) {
        hourStats[hour] = { wins: 0, total: 0 };
      }
      hourStats[hour].total++;
      if (entry.outcome === 'win') {
        hourStats[hour].wins++;
      }
    });
    
    const bestHour = Object.entries(hourStats)
      .filter(([_, stats]) => stats.total >= 3)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        winRate: (stats.wins / stats.total * 100).toFixed(1),
        trades: stats.total
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0];
    
    if (bestHour) {
      const timeRange = `${bestHour.hour}:00-${(bestHour.hour + 2) % 24}:00`;
      results.push({
        type: 'info',
        icon: Clock,
        text: `Peak performance: ${timeRange} sessions`,
        action: () => navigate('/dashboard/journal'),
        actionLabel: 'Details'
      });
    }
    
    // 3. Warning for poor performance times
    const worstHour = Object.entries(hourStats)
      .filter(([_, stats]) => stats.total >= 3)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        winRate: (stats.wins / stats.total * 100).toFixed(1)
      }))
      .sort((a, b) => parseFloat(a.winRate) - parseFloat(b.winRate))[0];
    
    if (worstHour && parseFloat(worstHour.winRate) < 50) {
      results.push({
        type: 'warning',
        icon: AlertTriangle,
        text: `Avoid ${worstHour.hour}:00 - ${worstHour.winRate}% win rate`,
        action: () => navigate('/dashboard/journal'),
        actionLabel: 'Review'
      });
    }
    
    // 4. Risk management score
    const withStopLoss = closedEntries.filter(e => e.stop_loss).length;
    const stopLossPercent = (withStopLoss / closedEntries.length) * 100;
    let riskScore = 10;
    
    if (stopLossPercent < 80) riskScore -= 2;
    if (stopLossPercent < 50) riskScore -= 2;
    
    const avgRR = closedEntries
      .filter(e => e.risk_reward_ratio)
      .reduce((sum, e) => sum + (e.risk_reward_ratio || 0), 0) / closedEntries.length;
    
    if (avgRR < 1.5) riskScore -= 2;
    if (avgRR < 1) riskScore -= 2;
    
    riskScore = Math.max(0, riskScore);
    
    results.push({
      type: riskScore >= 8 ? 'success' : 'warning',
      icon: Shield,
      text: `Risk management: ${riskScore}/10`,
      action: () => navigate('/dashboard/journal'),
      actionLabel: riskScore >= 8 ? 'Maintain' : 'Improve'
    });
    
    return results;
  }, [entries, navigate]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Smart Insights</CardTitle>
        <p className="text-xs text-muted-foreground">Based on your trading data</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div 
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  insight.type === 'success' ? 'bg-success/5 border-success/20' :
                  insight.type === 'warning' ? 'bg-destructive/5 border-destructive/20' :
                  'bg-primary/5 border-primary/20'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  insight.type === 'success' ? 'text-success' :
                  insight.type === 'warning' ? 'text-destructive' :
                  'text-primary'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{insight.text}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={insight.action}
                  className="text-xs flex-shrink-0"
                >
                  {insight.actionLabel} →
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
