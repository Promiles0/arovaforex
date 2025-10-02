import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsMetrics } from '@/hooks/useJournalAnalytics';

interface PnLChartProps {
  metrics: AnalyticsMetrics;
}

export default function PnLChart({ metrics }: PnLChartProps) {
  const chartData = metrics.pnlByDate.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pnl: item.pnl,
    cumulative: item.cumulative
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{payload[0].payload.date}</p>
          <p className={`text-sm ${payload[0].value >= 0 ? 'text-bull' : 'text-bear'}`}>
            Daily P&L: {payload[0].value >= 0 ? '+' : ''}${payload[0].value.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            Cumulative: ${payload[1].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className="journal-glassmorphism">
        <CardHeader>
          <CardTitle>P&L Over Time</CardTitle>
          <CardDescription>Track your profit and loss progression</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No P&L data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="journal-glassmorphism">
        <CardHeader>
          <CardTitle>P&L Over Time</CardTitle>
          <CardDescription>Cumulative profit and loss progression</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--bull))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--bull))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--bull))"
                strokeWidth={2}
                fill="url(#colorCumulative)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
