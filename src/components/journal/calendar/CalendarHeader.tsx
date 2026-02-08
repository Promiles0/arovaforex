import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarData } from '@/hooks/useCalendarData';
import { CalendarExport } from './CalendarExport';

interface CalendarHeaderProps {
  currentDate: Date;
  calendarData: CalendarData;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  calendarRef?: React.RefObject<HTMLDivElement>;
}

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType;
  color?: 'profit' | 'loss' | 'neutral';
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg",
      "bg-muted/30 border border-border/30",
      "backdrop-blur-sm"
    )}
  >
    <Icon className={cn(
      "w-4 h-4",
      color === 'profit' && "text-emerald-400",
      color === 'loss' && "text-red-400",
      color === 'neutral' && "text-muted-foreground"
    )} />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn(
        "text-sm font-semibold font-mono",
        color === 'profit' && "text-emerald-400",
        color === 'loss' && "text-red-400",
        !color && "text-foreground"
      )}>
        {value}
      </p>
    </div>
  </motion.div>
);

export const CalendarHeader = ({
  currentDate,
  calendarData,
  onPreviousMonth,
  onNextMonth,
  onToday,
  calendarRef
}: CalendarHeaderProps) => {
  const isCurrentMonth = format(new Date(), 'yyyy-MM') === format(currentDate, 'yyyy-MM');
  const monthLabel = format(currentDate, 'MMMM yyyy');
  
  const formatPnl = (value: number): string => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${value.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="calendar-header-glass rounded-xl p-4 sm:p-5 mb-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreviousMonth}
              className="h-10 w-10 rounded-lg hover:bg-primary/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          
          <h2 className="text-xl sm:text-2xl font-bold min-w-[180px] text-center">
            {monthLabel}
          </h2>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextMonth}
              className="h-10 w-10 rounded-lg hover:bg-primary/10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
          
          {!isCurrentMonth && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onToday}
                className="ml-2 gap-1.5 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              >
                <CalendarDays className="w-4 h-4" />
                Today
              </Button>
            </motion.div>
          )}
        </div>
        
        {/* Monthly Stats & Export */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <StatCard
            label="Total P&L"
            value={formatPnl(calendarData.totalPnl)}
            icon={calendarData.totalPnl >= 0 ? TrendingUp : TrendingDown}
            color={calendarData.totalPnl > 0 ? 'profit' : calendarData.totalPnl < 0 ? 'loss' : 'neutral'}
          />
          
          <StatCard
            label="Trading Days"
            value={calendarData.tradingDays}
            icon={CalendarDays}
            color="neutral"
          />
          
          <StatCard
            label="Win Rate"
            value={`${calendarData.winRate.toFixed(0)}%`}
            icon={Target}
            color={calendarData.winRate >= 50 ? 'profit' : calendarData.winRate > 0 ? 'loss' : 'neutral'}
          />

          {calendarRef && (
            <CalendarExport calendarRef={calendarRef} monthLabel={monthLabel} />
          )}
        </div>
      </div>
    </motion.div>
  );
};
