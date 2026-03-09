import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Trash2, History, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface BacktestRecord {
  id: string;
  pair: string;
  timeframe: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  exit_price: number | null;
  result: string;
  pips: number | null;
  risk_reward: number | null;
  duration_candles: number | null;
  start_date: string;
  end_date: string;
  created_at: string;
}

export function BacktestHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState<BacktestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('backtests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) setRecords(data as BacktestRecord[]);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('backtests').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setRecords(r => r.filter(rec => rec.id !== id));
    toast.success('Deleted');
  };

  if (loading) return null;
  if (records.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <History className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Backtest History</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{records.length} results</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        <AnimatePresence>
          {records.map((rec) => (
            <motion.div
              key={rec.id}
              layout
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-background/50 border border-border/40 group"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {rec.direction === 'buy' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--success))] shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-destructive shrink-0" />
                )}
                <span className="text-xs font-medium text-foreground truncate">{rec.pair}</span>
                <span className="text-[10px] text-muted-foreground">{rec.timeframe}</span>
              </div>

              <Badge
                variant="outline"
                className={
                  rec.result === 'WIN'
                    ? 'text-[10px] border-[hsl(var(--success))]/30 text-[hsl(var(--success))] bg-[hsl(var(--success))]/10'
                    : rec.result === 'LOSS'
                    ? 'text-[10px] border-destructive/30 text-destructive bg-destructive/10'
                    : 'text-[10px]'
                }
              >
                {rec.result}
              </Badge>

              <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">
                {rec.pips != null ? `${rec.pips > 0 ? '+' : ''}${rec.pips} pips` : '—'}
              </span>

              <span className="text-[10px] text-muted-foreground hidden md:inline">
                {format(new Date(rec.created_at), 'MMM d, yy')}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(rec.id)}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
