import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, TrendingDown, CalendarDays, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeekData } from '@/hooks/useCalendarData';
import { format, parseISO } from 'date-fns';

interface WeeklySummaryProps {
  weeks: WeekData[];
  onDayClick: (date: string) => void;
}

const WeekCard = ({ 
  week, 
  weekIndex, 
  onDayClick 
}: { 
  week: WeekData; 
  weekIndex: number;
  onDayClick: (date: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(weekIndex === 0);
  
  const formatPnl = (value: number): string => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${value.toFixed(2)}`;
  };

  const weekLabel = ['Week One', 'Week Two', 'Week Three', 'Week Four', 'Week Five', 'Week Six'][weekIndex] || `Week ${weekIndex + 1}`;
  const dateRange = `${format(parseISO(week.startDate), 'MMM d')} - ${format(parseISO(week.endDate), 'MMM d')}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: weekIndex * 0.1, type: 'spring', stiffness: 100 }}
      className={cn(
        "rounded-xl border border-border/30 overflow-hidden",
        "bg-gradient-to-br from-muted/20 to-muted/5",
        "backdrop-blur-sm transition-all duration-300",
        "hover:border-border/50 hover:shadow-lg"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="text-left">
          <h4 className="font-semibold text-sm">{weekLabel}</h4>
          <p className="text-xs text-muted-foreground">{dateRange}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-sm font-bold font-mono",
            week.totalPnl > 0 && "text-emerald-400",
            week.totalPnl < 0 && "text-red-400",
            week.totalPnl === 0 && "text-muted-foreground"
          )}>
            {formatPnl(week.totalPnl)}
          </span>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>
      
      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/30">
                  <CalendarDays className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Days</p>
                  <p className="text-sm font-semibold">{week.tradingDays}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <TrendingUp className="w-3.5 h-3.5 mx-auto text-emerald-400 mb-1" />
                  <p className="text-xs text-muted-foreground">Wins</p>
                  <p className="text-sm font-semibold text-emerald-400">{week.wins}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <TrendingDown className="w-3.5 h-3.5 mx-auto text-red-400 mb-1" />
                  <p className="text-xs text-muted-foreground">Losses</p>
                  <p className="text-sm font-semibold text-red-400">{week.losses}</p>
                </div>
              </div>
              
              {/* Win Rate */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Win Rate</span>
                </div>
                <span className={cn(
                  "text-sm font-semibold",
                  week.winRate >= 50 ? "text-emerald-400" : "text-red-400"
                )}>
                  {week.winRate.toFixed(0)}%
                </span>
              </div>
              
              {/* Trading Days Preview */}
              {week.tradingDays > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Trading Days</p>
                  <div className="flex flex-wrap gap-2">
                    {week.days
                      .filter(d => d.trades > 0)
                      .map((day, i) => (
                        <motion.button
                          key={day.date}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => onDayClick(day.date)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-medium",
                            "border border-border/30 transition-all",
                            "hover:scale-105 active:scale-95",
                            day.pnl > 0 && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                            day.pnl < 0 && "bg-red-500/10 border-red-500/30 text-red-400",
                            day.pnl === 0 && "bg-muted/30 text-muted-foreground"
                          )}
                        >
                          <span className="block">{format(parseISO(day.date), 'MMM d')}</span>
                          <span className="block font-mono text-[10px] mt-0.5">
                            {day.pnl >= 0 ? '+' : ''}{day.pnl.toFixed(0)}
                          </span>
                        </motion.button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const WeeklySummary = ({ weeks, onDayClick }: WeeklySummaryProps) => {
  return (
    <div className="space-y-3">
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1"
      >
        Weekly Breakdown
      </motion.h3>
      
      <div className="space-y-2">
        {weeks.map((week, index) => (
          <WeekCard
            key={week.weekNumber}
            week={week}
            weekIndex={index}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
};
