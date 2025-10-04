import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine } from 'recharts';
import { AnalyticsMetrics } from "@/hooks/useJournalAnalytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

interface RiskRewardScatterProps {
  metrics: AnalyticsMetrics;
}

export default function RiskRewardScatter({ metrics }: RiskRewardScatterProps) {
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [minRR, setMinRR] = useState<number>(0);

  const filteredData = useMemo(() => {
    let data = metrics.riskRewardScatter || [];
    
    if (filterOutcome !== 'all') {
      data = data.filter(d => d.outcome === filterOutcome);
    }
    
    const rr = data.map(d => d.reward / (d.risk || 1));
    if (minRR > 0) {
      data = data.filter((d, i) => rr[i] >= minRR);
    }
    
    return data;
  }, [metrics.riskRewardScatter, filterOutcome, minRR]);

  if (!metrics.riskRewardScatter || metrics.riskRewardScatter.length === 0) {
    return (
      <Card className="journal-glassmorphism">
        <CardHeader>
          <CardTitle>Risk/Reward Analysis</CardTitle>
          <CardDescription>Risk vs Reward scatter plot</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No risk/reward data available</p>
        </CardContent>
      </Card>
    );
  }

  const avgRR = filteredData.length > 0 
    ? filteredData.reduce((sum, d) => sum + (d.reward / (d.risk || 1)), 0) / filteredData.length 
    : 0;

  const above1to2 = filteredData.filter(d => (d.reward / (d.risk || 1)) > 2).length;
  const percentAbove1to2 = filteredData.length > 0 ? (above1to2 / filteredData.length) * 100 : 0;

  const bestRR = filteredData.length > 0
    ? Math.max(...filteredData.map(d => d.reward / (d.risk || 1)))
    : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    const rr = (data.reward / (data.risk || 1)).toFixed(2);
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{data.instrument}</p>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">Date: {new Date(data.date).toLocaleDateString()}</p>
          <p className="text-muted-foreground">Risk: ${data.risk.toFixed(2)}</p>
          <p className="text-muted-foreground">Reward: ${data.reward.toFixed(2)}</p>
          <p className="font-semibold">R:R Ratio: 1:{rr}</p>
          <p className={data.pnl >= 0 ? 'text-success' : 'text-destructive'}>
            P&L: ${data.pnl.toFixed(2)}
          </p>
          <p className={data.outcome === 'win' ? 'text-success' : 'text-destructive'}>
            Outcome: {data.outcome.toUpperCase()}
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
            <CardTitle>Risk/Reward Analysis</CardTitle>
            <CardDescription>Risk vs Reward distribution</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="win">Wins Only</SelectItem>
                <SelectItem value="loss">Losses Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={minRR.toString()} onValueChange={(v) => setMinRR(Number(v))}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All R:R</SelectItem>
                <SelectItem value="1">Min 1:1</SelectItem>
                <SelectItem value="2">Min 1:2</SelectItem>
                <SelectItem value="3">Min 1:3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              type="number" 
              dataKey="risk" 
              name="Risk" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              label={{ value: 'Risk ($)', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="number" 
              dataKey="reward" 
              name="Reward" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              label={{ value: 'Reward ($)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <ZAxis range={[60, 120]} />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for R:R ratios */}
            <ReferenceLine 
              segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} 
              stroke="hsl(var(--muted))" 
              strokeDasharray="3 3" 
              label={{ value: '1:1', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <ReferenceLine 
              segment={[{ x: 0, y: 0 }, { x: 50, y: 100 }]} 
              stroke="hsl(var(--muted))" 
              strokeDasharray="3 3"
              label={{ value: '1:2', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <ReferenceLine 
              segment={[{ x: 0, y: 0 }, { x: 33, y: 100 }]} 
              stroke="hsl(var(--muted))" 
              strokeDasharray="3 3"
              label={{ value: '1:3', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            
            <Scatter 
              name="Wins" 
              data={filteredData.filter(d => d.outcome === 'win')} 
              fill="hsl(var(--success))" 
              opacity={0.7}
            />
            <Scatter 
              name="Losses" 
              data={filteredData.filter(d => d.outcome === 'loss')} 
              fill="hsl(var(--destructive))" 
              opacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Insights */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">📊 Average R:R</p>
            <p className="font-semibold text-sm">1:{avgRR.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">📈 Above 1:2</p>
            <p className="font-semibold text-sm">{percentAbove1to2.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">🎯 Best R:R</p>
            <p className="font-semibold text-sm">1:{bestRR.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
