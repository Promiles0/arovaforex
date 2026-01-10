import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";

interface BalanceData {
  date: string;
  balance: number;
}

export const BalanceChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<BalanceData[]>([]);
  const [timeframe, setTimeframe] = useState('7D');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBalanceHistory(timeframe);
    }
  }, [user, timeframe]);

  const fetchBalanceHistory = async (period: string) => {
    setIsLoading(true);
    try {
      const days = period === '7D' ? 7 : period === '1M' ? 30 : 90;
      const startDate = subDays(new Date(), days);

      const { data, error } = await supabase
        .from('balance_history')
        .select('date, balance')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setChartData(data.map(d => ({
          date: format(new Date(d.date), 'MMM d'),
          balance: Number(d.balance)
        })));
      } else {
        // Generate sample data for demo purposes
        const sampleData: BalanceData[] = [];
        for (let i = days; i >= 0; i--) {
          const date = subDays(new Date(), i);
          sampleData.push({
            date: format(date, 'MMM d'),
            balance: Math.random() * 2000 + 3000 + (days - i) * 50
          });
        }
        setChartData(sampleData);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Fallback to sample data
      const days = period === '7D' ? 7 : period === '1M' ? 30 : 90;
      const sampleData: BalanceData[] = [];
      for (let i = days; i >= 0; i--) {
        const date = subDays(new Date(), i);
        sampleData.push({
          date: format(date, 'MMM d'),
          balance: Math.random() * 2000 + 3000 + (days - i) * 50
        });
      }
      setChartData(sampleData);
    } finally {
      setIsLoading(false);
    }
  };

  const timeframes = ['7D', '1M', '3M'];

  return (
    <motion.div 
      className="bg-card/50 backdrop-blur border border-border rounded-3xl p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Balance History</h3>
        
        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {timeframes.map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeframe === period
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Balance']}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};
