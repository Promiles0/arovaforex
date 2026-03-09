import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, TrendingUp, TrendingDown, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const PAIRS = [
  // Forex Majors
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD',
  'NZD/USD', 'USD/CHF',
  // Forex Crosses
  'GBP/JPY', 'EUR/JPY', 'EUR/GBP', 'AUD/JPY', 'CAD/JPY',
  'EUR/AUD', 'GBP/AUD', 'EUR/CAD', 'GBP/CAD',
  // Commodities
  'XAU/USD', 'XAG/USD',
  // Crypto
  'BTC/USD', 'ETH/USD', 'BNB/USD', 'SOL/USD', 'XRP/USD',
  // Indices
  'SPX', 'IXIC', 'DJI',
];

const TIMEFRAMES = [
  { value: '5m', label: '5 Min' },
  { value: '15m', label: '15 Min' },
  { value: '30m', label: '30 Min' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

export interface BacktestConfig {
  pair: string;
  timeframe: string;
  direction: 'buy' | 'sell';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  startDate: Date;
  endDate: Date;
}

interface StrategyPanelProps {
  onRunBacktest: (config: BacktestConfig) => void;
  isLoading: boolean;
}

export function StrategyPanel({ onRunBacktest, isLoading }: StrategyPanelProps) {
  const [pair, setPair] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('1h');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleSubmit = () => {
    if (!entry || !stopLoss || !takeProfit || !startDate || !endDate) return;
    onRunBacktest({
      pair,
      timeframe,
      direction,
      entry: parseFloat(entry),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      startDate,
      endDate,
    });
  };

  const isValid = entry && stopLoss && takeProfit && startDate && endDate;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Strategy Settings</h3>

      {/* Pair */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Trading Pair</Label>
        <Select value={pair} onValueChange={setPair}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Timeframe */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Timeframe</Label>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEFRAMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Direction */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Direction</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDirection('buy')}
            className={cn(
              'h-9 text-xs font-semibold',
              direction === 'buy'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'text-muted-foreground'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> BUY
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDirection('sell')}
            className={cn(
              'h-9 text-xs font-semibold',
              direction === 'sell'
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'text-muted-foreground'
            )}
          >
            <TrendingDown className="w-3.5 h-3.5 mr-1" /> SELL
          </Button>
        </div>
      </div>

      {/* Entry */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Entry Price</Label>
        <Input type="number" step="0.00001" placeholder="e.g. 1.0840" value={entry} onChange={e => setEntry(e.target.value)} className="h-9" />
      </div>

      {/* Stop Loss */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Stop Loss</Label>
        <Input type="number" step="0.00001" placeholder="e.g. 1.0800" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="h-9" />
      </div>

      {/* Take Profit */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Take Profit</Label>
        <Input type="number" step="0.00001" placeholder="e.g. 1.0900" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="h-9" />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full h-9 justify-start text-left text-xs font-normal', !startDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {startDate ? format(startDate, 'MMM d, yy') : 'Pick'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={d => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full h-9 justify-start text-left text-xs font-normal', !endDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {endDate ? format(endDate, 'MMM d, yy') : 'Pick'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={d => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Run Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</>
        ) : (
          <><Play className="w-4 h-4 mr-2" /> Run Backtest</>
        )}
      </Button>
    </div>
  );
}
