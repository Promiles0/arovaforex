import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { CandlestickData, Time } from 'lightweight-charts';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StrategyPanel, BacktestConfig } from '@/components/backtesting/StrategyPanel';
import { BacktestChart } from '@/components/backtesting/BacktestChart';
import { ResultsPanel, BacktestResult } from '@/components/backtesting/ResultsPanel';
import { BacktestHistory } from '@/components/backtesting/BacktestHistory';
import { SEO } from '@/components/seo/SEO';
import { BarChart3, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Backtesting() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [lastConfig, setLastConfig] = useState<BacktestConfig | null>(null);
  const [priceLines, setPriceLines] = useState<{ price: number; color: string; title: string }[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [historyKey, setHistoryKey] = useState(0);

  const saveBacktest = async () => {
    if (!result || !lastConfig || !user) return;
    setIsSaving(true);
    const { error } = await supabase.from('backtests').insert({
      user_id: user.id,
      pair: lastConfig.pair,
      timeframe: lastConfig.timeframe,
      direction: lastConfig.direction,
      entry_price: lastConfig.entry,
      stop_loss: lastConfig.stopLoss,
      take_profit: lastConfig.takeProfit,
      exit_price: result.exitPrice,
      result: result.result,
      pips: result.pips,
      risk_reward: result.riskReward,
      duration_candles: result.durationCandles,
      start_date: format(lastConfig.startDate, 'yyyy-MM-dd'),
      end_date: format(lastConfig.endDate, 'yyyy-MM-dd'),
    });
    setIsSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Backtest saved!');
    setHistoryKey(k => k + 1);
  };

  const runBacktest = useCallback(async (config: BacktestConfig) => {
    setIsLoading(true);
    setResult(null);
    setLastConfig(config);
    setPriceLines([]);
    setMarkers([]);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-chart-data', {
        body: {
          symbol: config.pair.replace('/', ''),
          interval: config.timeframe,
          start_date: format(config.startDate, 'yyyy-MM-dd'),
          end_date: format(config.endDate, 'yyyy-MM-dd'),
        },
      });

      if (error) throw error;
      if (!data?.data?.length) {
        toast.error('No data returned for this pair/date range');
        setIsLoading(false);
        return;
      }

      const candles: CandlestickData<Time>[] = data.data;
      setChartData(candles);

      const { entry, stopLoss, takeProfit, direction } = config;
      let exitPrice = entry;
      let tradeResult: 'WIN' | 'LOSS' | 'OPEN' = 'OPEN';
      let exitIndex = candles.length - 1;

      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        if (direction === 'buy') {
          if (c.low <= stopLoss) { tradeResult = 'LOSS'; exitPrice = stopLoss; exitIndex = i; break; }
          if (c.high >= takeProfit) { tradeResult = 'WIN'; exitPrice = takeProfit; exitIndex = i; break; }
        } else {
          if (c.high >= stopLoss) { tradeResult = 'LOSS'; exitPrice = stopLoss; exitIndex = i; break; }
          if (c.low <= takeProfit) { tradeResult = 'WIN'; exitPrice = takeProfit; exitIndex = i; break; }
        }
      }

      const isJpy = config.pair.includes('JPY');
      const pipMultiplier = isJpy ? 100 : 10000;
      const rawPips = direction === 'buy'
        ? (exitPrice - entry) * pipMultiplier
        : (entry - exitPrice) * pipMultiplier;

      const slDist = Math.abs(entry - stopLoss);
      const tpDist = Math.abs(takeProfit - entry);
      const rr = slDist > 0 ? tpDist / slDist : 0;

      setPriceLines([
        { price: entry, color: '#3b82f6', title: 'Entry' },
        { price: stopLoss, color: '#ef4444', title: 'Stop Loss' },
        { price: takeProfit, color: '#22c55e', title: 'Take Profit' },
      ]);

      if (tradeResult !== 'OPEN') {
        setMarkers([{
          time: candles[exitIndex].time,
          position: direction === 'buy' ? (tradeResult === 'WIN' ? 'aboveBar' : 'belowBar') : (tradeResult === 'WIN' ? 'belowBar' : 'aboveBar'),
          color: tradeResult === 'WIN' ? '#22c55e' : '#ef4444',
          shape: tradeResult === 'WIN' ? 'arrowUp' : 'arrowDown',
          text: tradeResult === 'WIN' ? 'TP Hit' : 'SL Hit',
        }]);
      }

      setResult({
        result: tradeResult,
        pips: parseFloat(rawPips.toFixed(1)),
        riskReward: parseFloat(rr.toFixed(2)),
        durationCandles: exitIndex + 1,
        entryPrice: entry,
        exitPrice,
      });

      toast.success(`Backtest complete: ${tradeResult}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <>
      <SEO title="Backtesting | ArovaForex" description="Test your trade ideas against historical market data" />
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Backtesting</h1>
            <p className="text-sm text-muted-foreground">Test your trade ideas against real historical data</p>
          </div>
        </motion.div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:w-72 shrink-0"
          >
            <StrategyPanel onRunBacktest={runBacktest} isLoading={isLoading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 min-h-[500px]"
          >
            <BacktestChart data={chartData} priceLines={priceLines} markers={markers} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Results + Save */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
              className="space-y-3"
            >
              <ResultsPanel result={result} />
              {user && (
                <div className="flex justify-end">
                  <Button
                    onClick={saveBacktest}
                    disabled={isSaving}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Save Result
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {user && <BacktestHistory key={historyKey} />}
      </div>
    </>
  );
}
