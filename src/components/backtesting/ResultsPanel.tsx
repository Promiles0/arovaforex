import { Trophy, XCircle, TrendingUp, Clock, ArrowRightLeft, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface BacktestResult {
  result: 'WIN' | 'LOSS' | 'OPEN';
  pips: number;
  riskReward: number;
  durationCandles: number;
  entryPrice: number;
  exitPrice: number;
}

interface ResultsPanelProps {
  result: BacktestResult | null;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  if (!result) return null;

  const isWin = result.result === 'WIN';
  const isOpen = result.result === 'OPEN';

  const cards = [
    {
      label: 'Result',
      value: result.result,
      icon: isOpen ? AlertCircle : isWin ? Trophy : XCircle,
      color: isOpen ? 'text-[hsl(var(--warning))]' : isWin ? 'text-[hsl(var(--success))]' : 'text-destructive',
      bg: isOpen
        ? 'bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/20'
        : isWin
          ? 'bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/20'
          : 'bg-destructive/5 border-destructive/20',
      glow: isOpen ? 'shadow-none' : isWin ? 'shadow-[var(--shadow-success)]' : 'shadow-[var(--shadow-danger)]',
    },
    {
      label: 'Profit (Pips)',
      value: `${result.pips > 0 ? '+' : ''}${result.pips.toFixed(1)}`,
      icon: DollarSign,
      color: result.pips >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive',
      bg: 'bg-card/80 border-border/60',
      glow: '',
    },
    {
      label: 'Risk / Reward',
      value: `1 : ${result.riskReward.toFixed(2)}`,
      icon: ArrowRightLeft,
      color: 'text-primary',
      bg: 'bg-card/80 border-border/60',
      glow: '',
    },
    {
      label: 'Duration',
      value: `${result.durationCandles} candles`,
      icon: Clock,
      color: 'text-muted-foreground',
      bg: 'bg-card/80 border-border/60',
      glow: '',
    },
    {
      label: 'Entry Price',
      value: result.entryPrice.toFixed(5),
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-card/80 border-border/60',
      glow: '',
    },
    {
      label: 'Exit Price',
      value: result.exitPrice.toFixed(5),
      icon: TrendingUp,
      color: isWin ? 'text-[hsl(var(--success))]' : 'text-destructive',
      bg: 'bg-card/80 border-border/60',
      glow: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06, type: 'spring', bounce: 0.25 }}
            className={cn(
              'rounded-xl border p-3.5 space-y-1.5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]',
              card.bg,
              card.glow,
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={cn('w-3.5 h-3.5', card.color)} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{card.label}</span>
            </div>
            <p className={cn('text-lg font-bold tabular-nums', card.color)}>{card.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
