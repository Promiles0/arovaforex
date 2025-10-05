import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AnalyticsMetrics } from "@/hooks/useJournalAnalytics";
import { TrendingDown, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface DrawdownChartProps {
  metrics: AnalyticsMetrics;
}

export default function DrawdownChart({ metrics }: DrawdownChartProps) {
  if (!metrics.drawdownData || metrics.drawdownData.length === 0) {
    return (
      <Card className="journal-glassmorphism">
        <CardHeader>
          <CardTitle>Drawdown Analysis</CardTitle>
          <CardDescription>Underwater equity curve</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">No drawdown data available</p>
        </CardContent>
      </Card>
    );
  }

  const currentDrawdown = metrics.drawdownData[metrics.drawdownData.length - 1]?.drawdownPercent || 0;
  const currentDaysInDrawdown = metrics.drawdownData[metrics.drawdownData.length - 1]?.daysInDrawdown || 0;
  
  const getDrawdownStatus = (percent: number) => {
    if (percent >= -5) return { color: 'success', label: 'Safe', icon: CheckCircle };
    if (percent >= -10) return { color: 'warning', label: 'Warning', icon: AlertTriangle };
    return { color: 'destructive', label: 'Danger', icon: TrendingDown };
  };

  const status = getDrawdownStatus(currentDrawdown);
  const StatusIcon = status.icon;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{new Date(data.date).toLocaleDateString()}</p>
        <div className="space-y-1 text-sm">
          <p className="text-destructive">
            Drawdown: {Math.abs(data.drawdownPercent ?? 0).toFixed(2)}%
          </p>
          <p className="text-muted-foreground">
            Days in drawdown: {data.daysInDrawdown ?? 0}
          </p>
          <p className="text-muted-foreground">
            Peak: ${(data.peak ?? 0).toFixed(2)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="journal-glassmorphism">
      <CardHeader>
        <CardTitle>Drawdown Analysis</CardTitle>
        <CardDescription>Underwater equity curve</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card/50 border border-border/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className={`w-4 h-4 text-${status.color}`} />
              <p className="text-xs text-muted-foreground">Current Drawdown</p>
            </div>
            <p className={`text-lg font-bold text-${status.color}`}>
              {Math.abs(currentDrawdown).toFixed(2)}%
            </p>
            <p className={`text-xs text-${status.color}`}>{status.label}</p>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Max Drawdown</p>
            </div>
            <p className="text-lg font-bold text-destructive">
              {(metrics.maxDrawdown?.percent ?? 0).toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.maxDrawdown?.date ? new Date(metrics.maxDrawdown.date).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Avg Recovery</p>
            </div>
            <p className="text-lg font-bold">
              {(metrics.avgRecoveryTime ?? 0).toFixed(0)} days
            </p>
            <p className="text-xs text-muted-foreground">
              Current: {currentDaysInDrawdown} days
            </p>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs text-muted-foreground">Recovery Time</p>
            </div>
            <p className="text-lg font-bold">
              {metrics.maxDrawdown?.recoveryDays ?? 0} days
            </p>
            <p className="text-xs text-muted-foreground">For max DD</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={metrics.drawdownData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={0} 
              stroke="hsl(var(--success))" 
              strokeDasharray="3 3" 
              label={{ value: 'Peak', fill: 'hsl(var(--success))', fontSize: 10 }}
            />
            <Area 
              type="monotone" 
              dataKey="drawdownPercent" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              fill="url(#drawdownGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Risk Alerts */}
        {currentDrawdown < -10 && (
          <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <p className="text-sm text-destructive font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Current drawdown exceeds 10%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Consider reviewing your risk management strategy
            </p>
          </div>
        )}

        {currentDaysInDrawdown > metrics.avgRecoveryTime * 1.5 && (
          <div className="mt-4 bg-warning/10 border border-warning/30 rounded-lg p-3">
            <p className="text-sm text-warning font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Longest drawdown: {currentDaysInDrawdown} days
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This is longer than your average recovery time
            </p>
          </div>
        )}

        {currentDrawdown === 0 && (
          <div className="mt-4 bg-success/10 border border-success/30 rounded-lg p-3">
            <p className="text-sm text-success font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Great recovery! Back to peak performance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
