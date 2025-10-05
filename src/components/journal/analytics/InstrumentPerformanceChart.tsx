import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalyticsMetrics } from "@/hooks/useJournalAnalytics";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

interface InstrumentPerformanceChartProps {
  metrics: AnalyticsMetrics;
}

type SortOption = 'pnl' | 'winRate' | 'trades' | 'name';

export default function InstrumentPerformanceChart({ metrics }: InstrumentPerformanceChartProps) {
  const [sortBy, setSortBy] = useState<SortOption>('pnl');

  if (!metrics.instrumentPerformance || metrics.instrumentPerformance.length === 0) {
    return (
      <Card className="journal-glassmorphism">
        <CardHeader>
          <CardTitle>Instrument Performance</CardTitle>
          <CardDescription>Performance breakdown by trading instrument</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No instrument data available</p>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...metrics.instrumentPerformance].sort((a, b) => {
    switch (sortBy) {
      case 'pnl': return b.totalPnL - a.totalPnL;
      case 'winRate': return b.winRate - a.winRate;
      case 'trades': return b.trades - a.trades;
      case 'name': return a.instrument.localeCompare(b.instrument);
      default: return 0;
    }
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{data.instrument}</p>
        <div className="space-y-1 text-sm">
          <p className={data.totalPnL >= 0 ? 'text-success' : 'text-destructive'}>
            P&L: ${(data.totalPnL ?? 0).toFixed(2)} ({((data.totalPnL ?? 0) / (metrics.totalPnL || 1) * 100).toFixed(1)}%)
          </p>
          <p className="text-muted-foreground">
            Win Rate: {(data.winRate ?? 0).toFixed(1)}%
          </p>
          <p className="text-muted-foreground">
            Trades: {data.trades ?? 0} ({data.wins ?? 0}W / {data.losses ?? 0}L)
          </p>
          <p className="text-muted-foreground">
            Avg P&L: ${(data.avgPnL ?? 0).toFixed(2)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="journal-glassmorphism">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Instrument Performance</CardTitle>
            <CardDescription>P&L breakdown by trading instrument</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={sortBy === 'pnl' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('pnl')}
              className="h-8 text-xs"
            >
              P&L
            </Button>
            <Button
              variant={sortBy === 'winRate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('winRate')}
              className="h-8 text-xs"
            >
              Win Rate
            </Button>
            <Button
              variant={sortBy === 'trades' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('trades')}
              className="h-8 text-xs"
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Trades
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis 
              dataKey="instrument" 
              type="category" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.1)' }} />
            <Bar 
              dataKey="totalPnL" 
              radius={[0, 4, 4, 0]}
              fill="hsl(var(--primary))"
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.totalPnL >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Top Insights */}
        <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Best Instrument</p>
              <p className="font-semibold text-sm">{sortedData[0]?.instrument || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Worst Instrument</p>
              <p className="font-semibold text-sm">{sortedData[sortedData.length - 1]?.instrument || 'N/A'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
