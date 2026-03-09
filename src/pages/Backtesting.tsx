import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { CandlestickData, Time } from 'lightweight-charts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StrategyPanel, BacktestConfig } from '@/components/backtesting/StrategyPanel';
import { BacktestChart } from '@/components/backtesting/BacktestChart';
import { ResultsPanel, BacktestResult } from '@/components/backtesting/ResultsPanel';
import { SEO } from '@/components/seo/SEO';

export default function Backtesting() {
  const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [priceLines, setPriceLines] = useState<{ price: number; color: string; title: string }[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);

  const runBacktest = useCallback(async (config: BacktestConfig) => {
    setIsLoading(true);
    setResult(null);
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

      // Run simulation
      const { entry, stopLoss, takeProfit, direction } = config;
      let exitPrice = entry;
      let tradeResult: 'WIN' | 'LOSS' | 'OPEN' = 'OPEN';
      let exitIndex = candles.length - 1;

      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        if (direction === 'buy') {
          if (c.low <= stopLoss) {
            tradeResult = 'LOSS';
            exitPrice = stopLoss;
            exitIndex = i;
            break;
          }
          if (c.high >= takeProfit) {
            tradeResult = 'WIN';
            exitPrice = takeProfit;
            exitIndex = i;
            break;
          }
        } else {
          if (c.high >= stopLoss) {
            tradeResult = 'LOSS';
            exitPrice = stopLoss;
            exitIndex = i;
            break;
          }
          if (c.low <= takeProfit) {
            tradeResult = 'WIN';
            exitPrice = takeProfit;
            exitIndex = i;
            break;
          }
        }
      }

      // Pips calculation
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
        setMarkers([
          {
            time: candles[exitIndex].time,
            position: direction === 'buy' ? (tradeResult === 'WIN' ? 'aboveBar' : 'belowBar') : (tradeResult === 'WIN' ? 'belowBar' : 'aboveBar'),
            color: tradeResult === 'WIN' ? '#22c55e' : '#ef4444',
            shape: tradeResult === 'WIN' ? 'arrowUp' : 'arrowDown',
            text: tradeResult === 'WIN' ? 'TP Hit' : 'SL Hit',
          },
        ]);
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
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Backtesting</h1>
          <p className="text-sm text-muted-foreground">Test your trade ideas against real historical data</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Strategy Panel */}
          <div className="w-full lg:w-72 shrink-0">
            <StrategyPanel onRunBacktest={runBacktest} isLoading={isLoading} />
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-[500px]">
            <BacktestChart data={chartData} priceLines={priceLines} markers={markers} isLoading={isLoading} />
          </div>
        </div>

        {/* Results */}
        <ResultsPanel result={result} />
      </div>
    </>
  );
}
