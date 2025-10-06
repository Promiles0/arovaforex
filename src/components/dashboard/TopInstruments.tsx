import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface TopInstrumentsProps {
  entries: any[];
}

export const TopInstruments = ({ entries }: TopInstrumentsProps) => {
  const navigate = useNavigate();
  
  const topInstruments = useMemo(() => {
    const closedEntries = entries.filter(e => e.outcome && e.outcome !== 'open');
    
    const instrumentStats: Record<string, {
      wins: number;
      total: number;
      pnl: number;
      history: { date: string; pnl: number }[];
    }> = {};
    
    closedEntries.forEach(entry => {
      if (entry.instrument) {
        if (!instrumentStats[entry.instrument]) {
          instrumentStats[entry.instrument] = { wins: 0, total: 0, pnl: 0, history: [] };
        }
        instrumentStats[entry.instrument].total++;
        if (entry.outcome === 'win') {
          instrumentStats[entry.instrument].wins++;
        }
        instrumentStats[entry.instrument].pnl += entry.pnl || 0;
        instrumentStats[entry.instrument].history.push({
          date: entry.entry_date,
          pnl: entry.pnl || 0
        });
      }
    });
    
    return Object.entries(instrumentStats)
      .map(([symbol, stats]) => ({
        symbol,
        winRate: ((stats.wins / stats.total) * 100).toFixed(1),
        trades: stats.total,
        pnl: stats.pnl,
        history: stats.history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 4);
  }, [entries]);

  if (topInstruments.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Your Top Instruments</CardTitle>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Start trading to see your instrument performance
            </p>
            <Button onClick={() => navigate('/dashboard/journal')}>
              Create First Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Your Top Instruments</CardTitle>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topInstruments.map((instrument) => (
            <div 
              key={instrument.symbol}
              className="p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{instrument.symbol}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className={`text-lg font-bold ${parseFloat(instrument.winRate) >= 60 ? 'text-success' : 'text-muted-foreground'}`}>
                    {instrument.winRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{instrument.trades}</p>
                  <p className="text-xs text-muted-foreground">Trades</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${instrument.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${Math.abs(instrument.pnl).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">P&L</p>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={instrument.history.map((h, idx) => ({ idx, pnl: h.pnl }))}>
                  <defs>
                    <linearGradient id={`gradient-${instrument.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={instrument.pnl >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={instrument.pnl >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke={instrument.pnl >= 0 ? "#10b981" : "#ef4444"} 
                    fill={`url(#gradient-${instrument.symbol})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => navigate('/dashboard/journal')}
              >
                View All Trades
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
