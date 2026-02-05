import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendarData, DayData, JournalEntry } from '@/hooks/useCalendarData';
import { CalendarHeader } from './CalendarHeader';
import { CalendarCell } from './CalendarCell';
import { WeeklySummary } from './WeeklySummary';
import { CalendarSkeleton } from './CalendarSkeleton';
import { DayDetailModal } from './DayDetailModal';
import { addMonths, subMonths, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JournalCalendarProps {
  entries: JournalEntry[];
  loading?: boolean;
  onAddEntry: () => void;
  onViewEntry: (entry: JournalEntry) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const contentVariants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(10px)' },
  animate: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98, 
    filter: 'blur(10px)',
    transition: { duration: 0.2 }
  }
};

export const JournalCalendar = ({ 
  entries, 
  loading = false, 
  onAddEntry,
  onViewEntry 
}: JournalCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  
  const calendarData = useCalendarData(
    entries,
    currentDate.getMonth(),
    currentDate.getFullYear()
  );
  
  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleDayClick = (day: DayData) => {
    if (day.trades > 0) {
      setSelectedDay(day);
    }
  };
  
  const handleDayClickFromSidebar = (dateString: string) => {
    const day = calendarData.days.find(d => d.date === dateString);
    if (day && day.trades > 0) {
      setSelectedDay(day);
    }
  };
  
  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedDay(null);
    onViewEntry(entry);
  };
  
  if (loading) {
    return <CalendarSkeleton />;
  }
  
  const hasAnyTrades = entries.length > 0;
  
  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        calendarData={calendarData}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={format(currentDate, 'yyyy-MM')}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {WEEKDAYS.map(day => (
                  <div 
                    key={day} 
                    className="text-center py-2 text-xs sm:text-sm font-medium text-muted-foreground"
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarData.days.map((day, index) => (
                  <CalendarCell
                    key={day.date}
                    day={day}
                    index={index}
                    onClick={handleDayClick}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Empty State */}
          {!hasAnyTrades && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-8 p-8 rounded-xl text-center",
                "bg-gradient-to-br from-muted/30 to-muted/10",
                "border border-border/30"
              )}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">No Trades This Month</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Start logging your trades to visualize your performance on the calendar
              </p>
              <Button onClick={onAddEntry} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Trade
              </Button>
            </motion.div>
          )}
        </div>
        
        {/* Weekly Summary Sidebar */}
        <div className="lg:col-span-1">
          <WeeklySummary
            weeks={calendarData.weeks}
            onDayClick={handleDayClickFromSidebar}
          />
        </div>
      </div>
      
      {/* Day Detail Modal */}
      <DayDetailModal
        day={selectedDay}
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        onViewEntry={handleViewEntry}
      />
    </div>
  );
};
