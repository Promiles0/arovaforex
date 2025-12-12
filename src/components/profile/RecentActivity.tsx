import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentActivityProps {
  userId: string;
}

export const RecentActivity = ({ userId }: RecentActivityProps) => {
  const { data: recentForecasts, isLoading } = useQuery({
    queryKey: ['recent-forecasts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forecasts')
        .select('id, title, currency_pair, trade_bias, created_at, likes_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border rounded-xl p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span>📊</span>
        Recent Forecasts
      </h3>

      {recentForecasts?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">📊</p>
          <p>No forecasts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentForecasts?.map((forecast, index) => (
            <motion.div
              key={forecast.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {forecast.title || 'Untitled Forecast'}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {forecast.currency_pair && (
                    <span className="text-sm text-muted-foreground">{forecast.currency_pair}</span>
                  )}
                  {forecast.trade_bias && (
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        forecast.trade_bias.toLowerCase() === 'long' || forecast.trade_bias.toLowerCase() === 'bullish'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {forecast.trade_bias.toLowerCase() === 'long' || forecast.trade_bias.toLowerCase() === 'bullish' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {forecast.trade_bias}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>{forecast.likes_count || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(forecast.created_at).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
