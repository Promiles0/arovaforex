import { useState, useEffect, useCallback } from 'react';
import { TradingChart } from '@/components/chart-analysis/TradingChart';
import { ReplayControls } from '@/components/chart-analysis/ReplayControls';
import { TradingPanel } from '@/components/chart-analysis/TradingPanel';
import { IndicatorsPanel } from '@/components/chart-analysis/IndicatorsPanel';
import { RefreshCw, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SEO } from '@/components/seo/SEO';

interface Trade {
  id: number;
  type: 'long' | 'short';
  entry: number;
  exitPrice?: number;
  stopLoss: number | null;
  takeProfit: number | null;
  lotSize: number;
  entryTime: number;
  entryIndex: number;
  exitTime?: number;
  exitIndex?: number;
  status: 'open' | 'closed';
  currentPrice: number;
  pnl: number;
  exitReason?: string;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const symbols = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'AUDUSD', label: 'AUD/USD' },
  { value: 'USDCAD', label: 'USD/CAD' },
  { value: 'XAU/USD', label: 'Gold (XAU)' },
];

const timeframes = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
];

export default function ChartAnalysis() {
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('15m');
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);

  // Load chart data
  const loadChartData = useCallback(async () => {
    setIsLoading(true);
    try {
      const cacheKey = `chart_${symbol}_${timeframe}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - new Date(parsed.cached_at).getTime();
        if (age < 3600000) {
          setChartData(parsed.data);
          setCurrentIndex(Math.min(50, parsed.data.length - 1));
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('fetch-chart-data', {
        body: { symbol, interval: timeframe },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to load data');

      setChartData(data.data);
      setCurrentIndex(Math.min(50, data.data.length - 1));
      localStorage.setItem(cacheKey, JSON.stringify(data));
      toast.success(`Loaded ${data.data.length} candles for ${symbol}`);
    } catch (error: any) {
      console.error('Chart data error:', error);
      toast.error('Failed to load chart data: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // Replay playback
  useEffect(() => {
    if (!isPlaying || currentIndex >= chartData.length - 1) {
      if (isPlaying && currentIndex >= chartData.length - 1) setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setCurrentIndex((p) => p + 1), 1000 / speed);
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, chartData.length, speed]);

  // Handle placing a trade
  const handlePlaceTrade = useCallback((trade: any) => {
    const candle = chartData[currentIndex];
    if (!candle) return;

    const newTrade: Trade = {
      id: Date.now(),
      ...trade,
      entry: candle.close,
      entryTime: candle.time,
      entryIndex: currentIndex,
      status: 'open',
      currentPrice: candle.close,
      pnl: 0,
    };
    setTrades((prev) => [...prev, newTrade]);
    toast.success(`${trade.type.toUpperCase()} order placed at ${candle.close.toFixed(candle.close > 10 ? 2 : 5)}`);
  }, [chartData, currentIndex]);

  // Update open trades
  useEffect(() => {
    const candle = chartData[currentIndex];
    if (!candle) return;

    setTrades((prev) =>
      prev.map((trade) => {
        if (trade.status !== 'open') return trade;
        const price = candle.close;
        const diff = trade.type === 'long' ? price - trade.entry : trade.entry - price;
        const pnl = diff * trade.lotSize * 100000;

        // Check SL
        if (trade.stopLoss) {
          const hitSL = trade.type === 'long' ? candle.low <= trade.stopLoss : candle.high >= trade.stopLoss;
          if (hitSL) {
            const slDiff = trade.type === 'long' ? trade.stopLoss - trade.entry : trade.entry - trade.stopLoss;
            return { ...trade, status: 'closed', exitPrice: trade.stopLoss, exitTime: candle.time, exitIndex: currentIndex, pnl: slDiff * trade.lotSize * 100000, exitReason: 'Stop Loss' };
          }
        }
        // Check TP
        if (trade.takeProfit) {
          const hitTP = trade.type === 'long' ? candle.high >= trade.takeProfit : candle.low <= trade.takeProfit;
          if (hitTP) {
            const tpDiff = trade.type === 'long' ? trade.takeProfit - trade.entry : trade.entry - trade.takeProfit;
            return { ...trade, status: 'closed', exitPrice: trade.takeProfit, exitTime: candle.time, exitIndex: currentIndex, pnl: tpDiff * trade.lotSize * 100000, exitReason: 'Take Profit' };
          }
        }
        return { ...trade, currentPrice: price, pnl };
      })
    );
  }, [currentIndex, chartData]);

  const handleCloseTrade = useCallback((tradeId: number) => {
    const candle = chartData[currentIndex];
    if (!candle) return;
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId && t.status === 'open'
          ? { ...t, status: 'closed', exitPrice: candle.close, exitTime: candle.time, exitIndex: currentIndex, exitReason: 'Manual', pnl: (t.type === 'long' ? candle.close - t.entry : t.entry - candle.close) * t.lotSize * 100000 }
          : t
      )
    );
  }, [chartData, currentIndex]);

  const toggleIndicator = useCallback((id: string) => {
    setActiveIndicators((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }, []);

  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const totalPnL = closedTrades.reduce((s, t) => s + t.pnl, 0);
  const wins = closedTrades.filter((t) => t.pnl > 0).length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
  const currentPrice = chartData[currentIndex]?.close || 0;
  const decimals = currentPrice > 10 ? 2 : 5;

  return (
    <div className="space-y-4">
      <SEO title="Chart Analysis | ArovaForex" description="Practice trading with historical data replay" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Chart Analysis
          </h1>
          <p className="text-sm text-muted-foreground">Practice trading with historical data replay</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 w-fit">Practice Mode</Badge>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={symbol} onValueChange={(v) => { setSymbol(v); setTrades([]); }}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {symbols.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={timeframe} onValueChange={(v) => { setTimeframe(v); setTrades([]); }}>
          <SelectTrigger className="w-[90px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {timeframes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <IndicatorsPanel activeIndicators={activeIndicators} onToggleIndicator={toggleIndicator} />

        <Button variant="outline" size="sm" onClick={loadChartData} disabled={isLoading} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="h-[500px] rounded-xl border border-border bg-card flex items-center justify-center">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading chart data...</p>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[500px] rounded-xl border border-border bg-card flex items-center justify-center">
          <p className="text-muted-foreground">No data available. Try a different symbol or timeframe.</p>
        </div>
      ) : (
        <>
          {/* Main Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
            {/* Chart + Replay */}
            <div className="space-y-3">
              <TradingChart
                chartData={chartData}
                currentIndex={currentIndex}
                symbol={symbol}
                timeframe={timeframe}
                indicators={activeIndicators}
              />
              <ReplayControls
                currentIndex={currentIndex}
                totalCandles={chartData.length}
                isPlaying={isPlaying}
                speed={speed}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onStepForward={() => setCurrentIndex((p) => Math.min(p + 1, chartData.length - 1))}
                onStepBackward={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
                onReset={() => { setCurrentIndex(0); setTrades([]); setIsPlaying(false); }}
                onSpeedChange={setSpeed}
                onSeek={setCurrentIndex}
              />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              <TradingPanel currentPrice={currentPrice} symbol={symbol} onPlaceTrade={handlePlaceTrade} />

              {/* Open Positions */}
              {openTrades.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Open Positions ({openTrades.length})</h3>
                  <div className="space-y-2">
                    {openTrades.map((trade) => (
                      <div key={trade.id} className="p-3 rounded-lg bg-muted/50 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <Badge variant={trade.type === 'long' ? 'default' : 'destructive'} className="text-[10px]">
                            {trade.type.toUpperCase()}
                          </Badge>
                          <span className="text-muted-foreground">{trade.lotSize} lots</span>
                        </div>
                        <div className="text-muted-foreground">Entry: {trade.entry.toFixed(decimals)}</div>
                        <div className={`font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </div>
                        <Button variant="outline" size="sm" className="w-full h-7 text-xs text-destructive" onClick={() => handleCloseTrade(trade.id)}>
                          <X className="w-3 h-3 mr-1" /> Close
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Performance</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Total P&L</p>
                    <p className={`text-sm font-bold ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Win Rate</p>
                    <p className="text-sm font-bold text-foreground">{winRate.toFixed(0)}%</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Trades</p>
                    <p className="text-sm font-bold text-foreground">{closedTrades.length}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">W / L</p>
                    <p className="text-sm font-bold">
                      <span className="text-success">{wins}</span>
                      {' / '}
                      <span className="text-destructive">{closedTrades.length - wins}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade History */}
          {closedTrades.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">Trade History ({closedTrades.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 pr-3">Type</th>
                      <th className="text-left py-2 pr-3">Entry</th>
                      <th className="text-left py-2 pr-3">Exit</th>
                      <th className="text-left py-2 pr-3">Reason</th>
                      <th className="text-right py-2">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-border/50">
                        <td className="py-2 pr-3">
                          <Badge variant={trade.type === 'long' ? 'default' : 'destructive'} className="text-[10px]">
                            {trade.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 tabular-nums">{trade.entry.toFixed(decimals)}</td>
                        <td className="py-2 pr-3 tabular-nums">{trade.exitPrice?.toFixed(decimals)}</td>
                        <td className="py-2 pr-3">{trade.exitReason}</td>
                        <td className={`py-2 text-right font-semibold tabular-nums ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
