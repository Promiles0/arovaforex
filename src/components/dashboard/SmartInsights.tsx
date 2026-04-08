import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, Shield, TrendingUp, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SmartInsightsProps {
  entries: any[];
}

const AI_INSIGHT_KEY = "arova-ai-insight-dismissed";

export const SmartInsights = ({ entries }: SmartInsightsProps) => {
  const navigate = useNavigate();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiDismissed, setAiDismissed] = useState(() => {
    const stored = localStorage.getItem(AI_INSIGHT_KEY);
    if (!stored) return false;
    // Re-show daily
    const dismissed = JSON.parse(stored);
    return dismissed.date === new Date().toDateString();
  });
  const [aiLoading, setAiLoading] = useState(false);

  const closedEntries = useMemo(() => entries.filter(e => e.outcome && e.outcome !== 'open'), [entries]);

  // Fetch AI insight
  useEffect(() => {
    if (aiDismissed || closedEntries.length < 3 || aiInsight) return;

    const fetchInsight = async () => {
      setAiLoading(true);
      try {
        const wins = closedEntries.filter(e => e.outcome === 'win').length;
        const winRate = ((wins / closedEntries.length) * 100).toFixed(1);
        const totalPnl = closedEntries.reduce((s, e) => s + (e.pnl || 0), 0).toFixed(2);
        const recentCount = closedEntries.filter(e => {
          const d = new Date(e.entry_date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return d >= weekAgo;
        }).length;

        const prompt = `Based on this trader's stats: ${closedEntries.length} total trades, ${winRate}% win rate, $${totalPnl} total P&L, ${recentCount} trades this week. Give ONE short actionable insight (max 2 sentences). Be specific and encouraging. No markdown.`;

        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            currentPage: "/dashboard",
          }),
        });

        if (!resp.ok || !resp.body) return;

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let result = "";
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const content = JSON.parse(json).choices?.[0]?.delta?.content;
              if (content) result += content;
            } catch {}
          }
        }

        if (result.trim()) setAiInsight(result.trim());
      } catch (err) {
        console.error("AI insight error:", err);
      } finally {
        setAiLoading(false);
      }
    };

    fetchInsight();
  }, [closedEntries, aiDismissed, aiInsight]);

  const dismissAiInsight = () => {
    setAiDismissed(true);
    localStorage.setItem(AI_INSIGHT_KEY, JSON.stringify({ date: new Date().toDateString() }));
  };
  
  const insights = useMemo(() => {
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
    
    const instrumentStats: Record<string, { wins: number; total: number; pnl: number }> = {};
    closedEntries.forEach(entry => {
      if (entry.instrument) {
        if (!instrumentStats[entry.instrument]) {
          instrumentStats[entry.instrument] = { wins: 0, total: 0, pnl: 0 };
        }
        instrumentStats[entry.instrument].total++;
        if (entry.outcome === 'win') instrumentStats[entry.instrument].wins++;
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
    
    const hourStats: Record<number, { wins: number; total: number }> = {};
    closedEntries.forEach(entry => {
      const hour = new Date(entry.entry_date).getHours();
      if (!hourStats[hour]) hourStats[hour] = { wins: 0, total: 0 };
      hourStats[hour].total++;
      if (entry.outcome === 'win') hourStats[hour].wins++;
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
          {/* AI Insight Card */}
          {!aiDismissed && (aiLoading || aiInsight) && (
            <div className="relative flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary mb-0.5">AI Insight</p>
                {aiLoading ? (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <p className="text-sm text-foreground">{aiInsight}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 flex-shrink-0 text-muted-foreground hover:text-foreground"
                onClick={dismissAiInsight}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

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
