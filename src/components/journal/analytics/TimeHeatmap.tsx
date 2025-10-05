import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsMetrics } from "@/hooks/useJournalAnalytics";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TimeHeatmapProps {
  metrics: AnalyticsMetrics;
}

type MetricType = 'winRate' | 'pnl' | 'trades';

export default function TimeHeatmap({ metrics }: TimeHeatmapProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('winRate');

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (!metrics.timeHeatmap || metrics.timeHeatmap.length === 0) {
    return (
      <Card className="journal-glassmorphism">
        <CardHeader>
          <CardTitle>Time-Based Performance</CardTitle>
          <CardDescription>Performance heatmap by day and hour</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground">No time data available</p>
        </CardContent>
      </Card>
    );
  }

  const getMetricValue = (day: number, hour: number) => {
    const cell = metrics.timeHeatmap.find(t => t.day === day && t.hour === hour);
    if (!cell) return null;
    
    switch (activeMetric) {
      case 'winRate': return cell.winRate;
      case 'pnl': return cell.pnl;
      case 'trades': return cell.trades;
    }
  };

  const getColor = (value: number | null) => {
    if (value === null) return 'bg-muted/20';
    
    if (activeMetric === 'winRate') {
      if (value >= 75) return 'bg-success/80';
      if (value >= 60) return 'bg-success/50';
      if (value >= 50) return 'bg-warning/50';
      if (value >= 30) return 'bg-destructive/30';
      return 'bg-destructive/60';
    } else if (activeMetric === 'pnl') {
      if (value > 100) return 'bg-success/80';
      if (value > 0) return 'bg-success/50';
      if (value > -100) return 'bg-destructive/30';
      return 'bg-destructive/60';
    } else {
      if (value >= 10) return 'bg-primary/80';
      if (value >= 5) return 'bg-primary/50';
      if (value >= 2) return 'bg-primary/30';
      return 'bg-primary/20';
    }
  };

  const bestTime = metrics.timeHeatmap.reduce((best, current) => 
    current.winRate > best.winRate ? current : best
  , metrics.timeHeatmap[0]);

  const worstTime = metrics.timeHeatmap.reduce((worst, current) => 
    current.winRate < worst.winRate ? current : worst
  , metrics.timeHeatmap[0]);

  return (
    <Card className="journal-glassmorphism">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Time-Based Performance</CardTitle>
            <CardDescription>Performance heatmap by day and time</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={activeMetric === 'winRate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMetric('winRate')}
              className="h-8 text-xs"
            >
              Win Rate
            </Button>
            <Button
              variant={activeMetric === 'pnl' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMetric('pnl')}
              className="h-8 text-xs"
            >
              P&L
            </Button>
            <Button
              variant={activeMetric === 'trades' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMetric('trades')}
              className="h-8 text-xs"
            >
              Trades
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Days headers */}
            <div className="flex gap-1 mb-1 ml-12">
              {days.map(day => (
                <div key={day} className="w-8 text-center text-xs text-muted-foreground font-semibold">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {hours.map(hour => (
                <div key={hour} className="flex gap-1 items-center">
                  <div className="w-10 text-right text-xs text-muted-foreground">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {days.map((_, dayIndex) => {
                    const value = getMetricValue(dayIndex, hour);
                    const cell = metrics.timeHeatmap.find(t => t.day === dayIndex && t.hour === hour);
                    
                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className={`w-8 h-4 rounded ${getColor(value)} transition-all duration-200 hover:scale-150 hover:z-10 cursor-pointer relative group`}
                        title={value !== null ? `${days[dayIndex]} ${hour}:00\n${
                          activeMetric === 'winRate' ? `${value.toFixed(1)}% win rate` :
                          activeMetric === 'pnl' ? `$${value.toFixed(2)} P&L` :
                          `${value} trades`
                        }` : 'No data'}
                      >
                        {cell && (
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg text-xs whitespace-nowrap z-20">
                            <p className="font-semibold">{days[dayIndex]} {hour}:00</p>
                            <p className="text-muted-foreground">
                              {activeMetric === 'winRate' && `${(cell.winRate ?? 0).toFixed(1)}% win rate`}
                              {activeMetric === 'pnl' && `$${(cell.pnl ?? 0).toFixed(2)} P&L`}
                              {activeMetric === 'trades' && `${cell.trades ?? 0} trades`}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">✨ Best Time</p>
            <p className="font-semibold text-sm">
              {days[bestTime.day]} {bestTime.hour}:00 ({(bestTime.winRate ?? 0).toFixed(1)}% win rate)
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">⚠️ Avoid</p>
            <p className="font-semibold text-sm">
              {days[worstTime.day]} {worstTime.hour}:00 ({(worstTime.winRate ?? 0).toFixed(1)}% win rate)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
