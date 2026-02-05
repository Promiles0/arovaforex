import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DayData } from '@/hooks/useCalendarData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';

interface CalendarCellProps {
  day: DayData;
  index: number;
  onClick: (day: DayData) => void;
}

const cellVariants = {
  initial: { opacity: 0, y: 20, scale: 0.9 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.02,
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }),
  hover: {
    scale: 1.05,
    rotateX: 3,
    rotateY: 3,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 }
};

const formatPnl = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue >= 1000) {
    return `${value >= 0 ? '+' : '-'}$${(absValue / 1000).toFixed(1)}k`;
  }
  return `${value >= 0 ? '+' : '-'}$${absValue.toFixed(0)}`;
};

export const CalendarCell = ({ day, index, onClick }: CalendarCellProps) => {
  const hasTrades = day.trades > 0;
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            variants={cellVariants}
            initial="initial"
            animate="animate"
            whileHover={hasTrades ? "hover" : undefined}
            whileTap="tap"
            custom={index}
            onClick={() => hasTrades && onClick(day)}
            style={{ perspective: 1000 }}
            className={cn(
              "relative min-h-[80px] sm:min-h-[100px] p-2 sm:p-3 rounded-xl transition-all duration-300 cursor-pointer select-none",
              "border border-border/30",
              // Base styling
              !day.isCurrentMonth && "opacity-30",
              // No trades
              day.outcome === 'none' && "bg-muted/30 hover:bg-muted/50",
              // Profit styling
              day.outcome === 'profit' && [
                "calendar-cell-profit",
                "hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
              ],
              // Loss styling
              day.outcome === 'loss' && [
                "calendar-cell-loss",
                "hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]"
              ],
              // Breakeven styling
              day.outcome === 'breakeven' && "bg-muted/50 border-muted-foreground/30",
              // Today highlight
              day.isToday && "calendar-cell-today"
            )}
          >
            {/* Date number and trade count */}
            <div className="flex items-start justify-between mb-1">
              <span className={cn(
                "text-base sm:text-lg font-semibold",
                day.isToday ? "text-amber-400" : "text-foreground",
                !day.isCurrentMonth && "text-muted-foreground"
              )}>
                {day.dayOfMonth}
              </span>
              
              {hasTrades && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  {day.trades}
                  <span className="text-[10px]">⇅</span>
                </span>
              )}
            </div>
            
            {/* P&L Display */}
            {hasTrades && (
              <div className="mt-auto">
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 + 0.3, duration: 0.3 }}
                  className={cn(
                    "text-sm sm:text-base font-bold font-mono text-center",
                    day.pnl > 0 && "text-emerald-400",
                    day.pnl < 0 && "text-red-400",
                    day.pnl === 0 && "text-muted-foreground"
                  )}
                >
                  {formatPnl(day.pnl)}
                </motion.div>
                
                {/* Mini win/loss indicator */}
                <div className="flex items-center justify-center gap-1 mt-1">
                  {day.wins > 0 && (
                    <span className="text-[10px] text-emerald-400 flex items-center">
                      <TrendingUp className="w-2.5 h-2.5" />
                      {day.wins}
                    </span>
                  )}
                  {day.losses > 0 && (
                    <span className="text-[10px] text-red-400 flex items-center">
                      <TrendingDown className="w-2.5 h-2.5" />
                      {day.losses}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Glow overlay for profit days */}
            {day.outcome === 'profit' && (
              <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent" />
              </div>
            )}
          </motion.div>
        </TooltipTrigger>
        
        {hasTrades && (
          <TooltipContent 
            side="top" 
            className="calendar-tooltip bg-background/95 backdrop-blur-xl border-border/50 p-3"
          >
            <div className="space-y-2">
              <p className="font-semibold">
                {format(parseISO(day.date), 'MMMM d, yyyy')}
              </p>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  Trades: <span className="text-foreground">{day.trades}</span>
                </p>
                <p className={cn(
                  day.pnl > 0 ? "text-emerald-400" : day.pnl < 0 ? "text-red-400" : "text-muted-foreground"
                )}>
                  P&L: {day.pnl >= 0 ? '+' : ''}{day.pnl.toFixed(2)}
                </p>
                {(day.wins > 0 || day.losses > 0) && (
                  <p className="text-muted-foreground">
                    Win Rate: <span className="text-foreground">
                      {day.wins + day.losses > 0 
                        ? ((day.wins / (day.wins + day.losses)) * 100).toFixed(0) 
                        : 0}%
                    </span>
                  </p>
                )}
              </div>
              <p className="text-xs text-primary mt-2">Click to view trades →</p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
