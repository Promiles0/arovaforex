import { useMemo } from 'react';

interface JournalEntry {
  id: string;
  entry_date: string;
  outcome?: 'win' | 'loss' | 'breakeven' | 'open';
  pnl?: number;
  risk_reward_ratio?: number;
  hold_time_minutes?: number;
  instrument?: string;
  created_at: string;
}

export interface AnalyticsMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  openTrades: number;
  winRate: number;
  totalPnL: number;
  averagePnL: number;
  bestTrade: number;
  worstTrade: number;
  averageRiskReward: number;
  averageHoldTime: number;
  bestDay: string;
  worstDay: string;
  pnlByDate: { date: string; pnl: number; cumulative: number }[];
  winRateByDate: { date: string; winRate: number; trades: number }[];
  tradesByOutcome: { outcome: string; count: number; percentage: number }[];
  profitFactor: number;
}

export const useJournalAnalytics = (
  entries: JournalEntry[],
  startDate?: Date,
  endDate?: Date
): AnalyticsMetrics => {
  return useMemo(() => {
    // Filter entries by date range
    let filtered = entries;
    if (startDate || endDate) {
      filtered = entries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }

    // Filter out open trades for most calculations
    const closedTrades = filtered.filter(e => e.outcome && e.outcome !== 'open');
    const totalTrades = closedTrades.length;

    // Count outcomes
    const winningTrades = closedTrades.filter(e => e.outcome === 'win').length;
    const losingTrades = closedTrades.filter(e => e.outcome === 'loss').length;
    const breakevenTrades = closedTrades.filter(e => e.outcome === 'breakeven').length;
    const openTrades = filtered.filter(e => e.outcome === 'open').length;

    // Win rate
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // P&L calculations
    const tradesWithPnL = closedTrades.filter(e => e.pnl !== null && e.pnl !== undefined);
    const totalPnL = tradesWithPnL.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const averagePnL = tradesWithPnL.length > 0 ? totalPnL / tradesWithPnL.length : 0;
    const bestTrade = tradesWithPnL.length > 0 
      ? Math.max(...tradesWithPnL.map(e => e.pnl || 0))
      : 0;
    const worstTrade = tradesWithPnL.length > 0
      ? Math.min(...tradesWithPnL.map(e => e.pnl || 0))
      : 0;

    // Risk/Reward ratio
    const tradesWithRR = closedTrades.filter(e => e.risk_reward_ratio);
    const averageRiskReward = tradesWithRR.length > 0
      ? tradesWithRR.reduce((sum, e) => sum + (e.risk_reward_ratio || 0), 0) / tradesWithRR.length
      : 0;

    // Hold time
    const tradesWithHoldTime = closedTrades.filter(e => e.hold_time_minutes);
    const averageHoldTime = tradesWithHoldTime.length > 0
      ? tradesWithHoldTime.reduce((sum, e) => sum + (e.hold_time_minutes || 0), 0) / tradesWithHoldTime.length
      : 0;

    // P&L by date
    const pnlByDateMap = new Map<string, number>();
    tradesWithPnL.forEach(entry => {
      const date = entry.entry_date;
      const current = pnlByDateMap.get(date) || 0;
      pnlByDateMap.set(date, current + (entry.pnl || 0));
    });

    const sortedDates = Array.from(pnlByDateMap.keys()).sort();
    let cumulativePnL = 0;
    const pnlByDate = sortedDates.map(date => {
      const pnl = pnlByDateMap.get(date) || 0;
      cumulativePnL += pnl;
      return { date, pnl, cumulative: cumulativePnL };
    });

    // Best and worst day
    const bestDay = pnlByDate.length > 0
      ? pnlByDate.reduce((max, day) => day.pnl > max.pnl ? day : max).date
      : '';
    const worstDay = pnlByDate.length > 0
      ? pnlByDate.reduce((min, day) => day.pnl < min.pnl ? day : min).date
      : '';

    // Win rate by date (7-day rolling)
    const winRateByDate = sortedDates.map((date, index) => {
      const start = Math.max(0, index - 6);
      const recentDates = sortedDates.slice(start, index + 1);
      const recentTrades = closedTrades.filter(e => recentDates.includes(e.entry_date));
      const wins = recentTrades.filter(e => e.outcome === 'win').length;
      const total = recentTrades.length;
      return {
        date,
        winRate: total > 0 ? (wins / total) * 100 : 0,
        trades: total
      };
    });

    // Trades by outcome
    const tradesByOutcome = [
      { outcome: 'Win', count: winningTrades, percentage: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0 },
      { outcome: 'Loss', count: losingTrades, percentage: totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0 },
      { outcome: 'Breakeven', count: breakevenTrades, percentage: totalTrades > 0 ? (breakevenTrades / totalTrades) * 100 : 0 },
    ];

    // Profit factor
    const totalWins = tradesWithPnL.filter(e => e.outcome === 'win').reduce((sum, e) => sum + (e.pnl || 0), 0);
    const totalLosses = Math.abs(tradesWithPnL.filter(e => e.outcome === 'loss').reduce((sum, e) => sum + (e.pnl || 0), 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      openTrades,
      winRate,
      totalPnL,
      averagePnL,
      bestTrade,
      worstTrade,
      averageRiskReward,
      averageHoldTime,
      bestDay,
      worstDay,
      pnlByDate,
      winRateByDate,
      tradesByOutcome,
      profitFactor
    };
  }, [entries, startDate, endDate]);
};
