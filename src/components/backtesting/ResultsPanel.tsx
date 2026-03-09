import { Trophy, XCircle, TrendingUp, Clock, ArrowRightLeft, DollarSign } from 'lucide-react';
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
      icon: isWin ? Trophy : XCircle,
      color: isOpen ? 'text-yellow-400' : isWin ? 'text-emerald-400' : 'text-red-400',
      bg: isOpen ? 'bg-yellow-500/10 border-yellow-500/20' : isWin ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Profit (Pips)',
      value: `${result.pips > 0 ? '+' : ''}${result.pips.toFixed(1)}`,
      icon: DollarSign,
      color: result.pips >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: 'bg-muted/50 border-border',
    },
    {
      label: 'Risk / Reward',
      value: `1 : ${result.riskReward.toFixed(2)}`,
      icon: ArrowRightLeft,
      color: 'text-blue-400',
      bg: 'bg-muted/50 border-border',
    },
    {
      label: 'Duration',
      value: `${result.durationCandles} candles`,
      icon: Clock,
      color: 'text-purple-400',
      bg: 'bg-muted/50 border-border',
    },
    {
      label: 'Entry Price',
      value: result.entryPrice.toFixed(5),
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-muted/50 border-border',
    },
    {
      label: 'Exit Price',
      value: result.exitPrice.toFixed(5),
      icon: TrendingUp,
      color: isWin ? 'text-emerald-400' : 'text-red-400',
      bg: 'bg-muted/50 border-border',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={cn('rounded-xl border p-3 space-y-1', card.bg)}>
            <div className="flex items-center gap-1.5">
              <Icon className={cn('w-3.5 h-3.5', card.color)} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
            </div>
            <p className={cn('text-lg font-bold tabular-nums', card.color)}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
