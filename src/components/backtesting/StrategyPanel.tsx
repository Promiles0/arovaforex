import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, TrendingUp, TrendingDown, Play, Loader2, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PairSelector } from './PairSelector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';




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
      pair, timeframe, direction,
      entry: parseFloat(entry),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      startDate, endDate,
    });
  };

  const isValid = entry && stopLoss && takeProfit && startDate && endDate;

  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 space-y-4 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Settings2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Strategy Settings</h3>
      </div>

      {/* Pair - Grouped */}
      <PairSelector value={pair} onChange={setPair} />

      {/* Timeframe */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Timeframe</Label>
        <div className="grid grid-cols-3 gap-1">
          {TIMEFRAMES.map(t => (
            <button
              key={t.value}
              onClick={() => setTimeframe(t.value)}
              className={cn(
                'h-8 rounded-lg text-[11px] font-medium transition-all duration-200 border',
                timeframe === t.value
                  ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                  : 'bg-background/50 border-border/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Direction</Label>
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setDirection('buy')}
            className={cn(
              'h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 border',
              direction === 'buy'
                ? 'bg-[hsl(var(--success))]/15 border-[hsl(var(--success))]/40 text-[hsl(var(--success))]'
                : 'bg-background/50 border-border/40 text-muted-foreground hover:bg-muted/60'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" /> BUY
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setDirection('sell')}
            className={cn(
              'h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 border',
              direction === 'sell'
                ? 'bg-[hsl(var(--destructive))]/15 border-[hsl(var(--destructive))]/40 text-[hsl(var(--destructive))]'
                : 'bg-background/50 border-border/40 text-muted-foreground hover:bg-muted/60'
            )}
          >
            <TrendingDown className="w-3.5 h-3.5" /> SELL
          </motion.button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50" />

      {/* Price Inputs */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Entry Price</Label>
          <Input type="number" step="0.00001" placeholder="e.g. 1.0840" value={entry} onChange={e => setEntry(e.target.value)} className="h-9 bg-background/50 border-border/60 tabular-nums" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            Stop Loss
          </Label>
          <Input type="number" step="0.00001" placeholder="e.g. 1.0800" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="h-9 bg-background/50 border-border/60 tabular-nums" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Take Profit
          </Label>
          <Input type="number" step="0.00001" placeholder="e.g. 1.0900" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="h-9 bg-background/50 border-border/60 tabular-nums" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50" />

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full h-9 justify-start text-left text-xs font-normal bg-background/50 border-border/60', !startDate && 'text-muted-foreground')}>
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
              <Button variant="outline" className={cn('w-full h-9 justify-start text-left text-xs font-normal bg-background/50 border-border/60', !endDate && 'text-muted-foreground')}>
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
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-[var(--shadow-brand)] transition-shadow hover:shadow-[var(--shadow-hover)]"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> Run Backtest</>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
