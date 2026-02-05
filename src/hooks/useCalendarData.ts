import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth,
  getWeek,
  parseISO
} from 'date-fns';

// Use a flexible type that can accept any journal entry shape
export interface JournalEntry {
  id: string;
  title: string;
  entry_date: string;
  pnl?: number | null;
  outcome?: 'win' | 'loss' | 'breakeven' | 'open' | null;
  instrument?: string | null;
  direction?: 'long' | 'short' | 'neutral' | null;
}

export interface DayData {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  trades: number;
  pnl: number;
  wins: number;
  losses: number;
  breakeven: number;
  outcome: 'profit' | 'loss' | 'breakeven' | 'none';
  entries: JournalEntry[];
}

export interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalPnl: number;
  tradingDays: number;
  winRate: number;
  wins: number;
  losses: number;
  days: DayData[];
}

export interface CalendarData {
  month: number;
  year: number;
  days: DayData[];
  weeks: WeekData[];
  totalPnl: number;
  tradingDays: number;
  winRate: number;
  totalTrades: number;
  wins: number;
  losses: number;
  bestDay: DayData | null;
  worstDay: DayData | null;
}

export const useCalendarData = (
  entries: JournalEntry[],
  month: number,
  year: number
): CalendarData => {
  return useMemo(() => {
    const currentDate = new Date(year, month, 1);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Get all days in the calendar view (includes days from prev/next month)
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Create a map of entries by date for quick lookup
    const entriesByDate = new Map<string, JournalEntry[]>();
    entries.forEach(entry => {
      const dateKey = entry.entry_date;
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }
      entriesByDate.get(dateKey)!.push(entry);
    });
    
    // Build day data
    const days: DayData[] = allDays.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayEntries = entriesByDate.get(dateKey) || [];
      
      const wins = dayEntries.filter(e => e.outcome === 'win').length;
      const losses = dayEntries.filter(e => e.outcome === 'loss').length;
      const breakeven = dayEntries.filter(e => e.outcome === 'breakeven').length;
      const pnl = dayEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);
      
      let outcome: 'profit' | 'loss' | 'breakeven' | 'none' = 'none';
      if (dayEntries.length > 0) {
        if (pnl > 0) outcome = 'profit';
        else if (pnl < 0) outcome = 'loss';
        else outcome = 'breakeven';
      }
      
      return {
        date: dateKey,
        dayOfMonth: date.getDate(),
        isCurrentMonth: isSameMonth(date, currentDate),
        isToday: dateKey === today,
        trades: dayEntries.length,
        pnl,
        wins,
        losses,
        breakeven,
        outcome,
        entries: dayEntries
      };
    });
    
    // Build week data
    const weeksMap = new Map<number, DayData[]>();
    days.forEach(day => {
      const weekNum = getWeek(parseISO(day.date), { weekStartsOn: 0 });
      if (!weeksMap.has(weekNum)) {
        weeksMap.set(weekNum, []);
      }
      weeksMap.get(weekNum)!.push(day);
    });
    
    const weeks: WeekData[] = Array.from(weeksMap.entries())
      .map(([weekNum, weekDays]) => {
        const tradingDays = weekDays.filter(d => d.trades > 0);
        const totalPnl = weekDays.reduce((sum, d) => sum + d.pnl, 0);
        const wins = weekDays.reduce((sum, d) => sum + d.wins, 0);
        const losses = weekDays.reduce((sum, d) => sum + d.losses, 0);
        const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
        
        return {
          weekNumber: weekNum,
          startDate: weekDays[0].date,
          endDate: weekDays[weekDays.length - 1].date,
          totalPnl,
          tradingDays: tradingDays.length,
          winRate,
          wins,
          losses,
          days: weekDays
        };
      })
      .sort((a, b) => a.weekNumber - b.weekNumber);
    
    // Calculate month totals (only for current month days)
    const currentMonthDays = days.filter(d => d.isCurrentMonth);
    const tradingDays = currentMonthDays.filter(d => d.trades > 0);
    const totalPnl = currentMonthDays.reduce((sum, d) => sum + d.pnl, 0);
    const totalTrades = currentMonthDays.reduce((sum, d) => sum + d.trades, 0);
    const totalWins = currentMonthDays.reduce((sum, d) => sum + d.wins, 0);
    const totalLosses = currentMonthDays.reduce((sum, d) => sum + d.losses, 0);
    const winRate = totalWins + totalLosses > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0;
    
    // Find best and worst days
    const daysWithTrades = tradingDays.filter(d => d.trades > 0);
    const bestDay = daysWithTrades.length > 0 
      ? daysWithTrades.reduce((best, d) => d.pnl > best.pnl ? d : best, daysWithTrades[0])
      : null;
    const worstDay = daysWithTrades.length > 0
      ? daysWithTrades.reduce((worst, d) => d.pnl < worst.pnl ? d : worst, daysWithTrades[0])
      : null;
    
    return {
      month,
      year,
      days,
      weeks,
      totalPnl,
      tradingDays: tradingDays.length,
      winRate,
      totalTrades,
      wins: totalWins,
      losses: totalLosses,
      bestDay,
      worstDay
    };
  }, [entries, month, year]);
};
