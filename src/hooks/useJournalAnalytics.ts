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
  instrumentPerformance: { instrument: string; totalPnL: number; trades: number; wins: number; losses: number; winRate: number; avgPnL: number }[];
  timeHeatmap: { day: number; hour: number; winRate: number; trades: number; pnl: number }[];
  riskRewardScatter: { id: string; risk: number; reward: number; outcome: 'win' | 'loss'; pnl: number; date: string; instrument: string }[];
  drawdownData: { date: string; drawdownPercent: number; daysInDrawdown: number; peak: number }[];
  maxDrawdown: { percent: number; date: string; recoveryDays: number };
  avgRecoveryTime: number;
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

    // Instrument Performance
    const instrumentMap = new Map<string, { pnl: number; trades: number; wins: number; losses: number }>();
    closedTrades.forEach(entry => {
      if (entry.instrument && entry.pnl !== null && entry.pnl !== undefined) {
        const current = instrumentMap.get(entry.instrument) || { pnl: 0, trades: 0, wins: 0, losses: 0 };
        instrumentMap.set(entry.instrument, {
          pnl: current.pnl + entry.pnl,
          trades: current.trades + 1,
          wins: current.wins + (entry.outcome === 'win' ? 1 : 0),
          losses: current.losses + (entry.outcome === 'loss' ? 1 : 0)
        });
      }
    });
    const instrumentPerformance = Array.from(instrumentMap.entries()).map(([instrument, data]) => ({
      instrument,
      totalPnL: data.pnl,
      trades: data.trades,
      wins: data.wins,
      losses: data.losses,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      avgPnL: data.trades > 0 ? data.pnl / data.trades : 0
    })).sort((a, b) => b.totalPnL - a.totalPnL);

    // Time-Based Heatmap
    const timeMap = new Map<string, { wins: number; total: number; pnl: number }>();
    closedTrades.forEach(entry => {
      const date = new Date(entry.entry_date);
      const day = date.getDay();
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      const current = timeMap.get(key) || { wins: 0, total: 0, pnl: 0 };
      timeMap.set(key, {
        wins: current.wins + (entry.outcome === 'win' ? 1 : 0),
        total: current.total + 1,
        pnl: current.pnl + (entry.pnl || 0)
      });
    });
    const timeHeatmap = Array.from(timeMap.entries()).map(([key, data]) => {
      const [day, hour] = key.split('-').map(Number);
      return {
        day,
        hour,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
        trades: data.total,
        pnl: data.pnl
      };
    });

    // Risk/Reward Scatter
    const riskRewardScatter = closedTrades
      .filter(e => e.pnl !== null && e.pnl !== undefined)
      .map(entry => {
        const risk = Math.abs(entry.pnl || 0) / (entry.risk_reward_ratio || 1);
        const reward = Math.abs(entry.pnl || 0);
        return {
          id: entry.id,
          risk,
          reward,
          outcome: entry.outcome as 'win' | 'loss',
          pnl: entry.pnl || 0,
          date: entry.entry_date,
          instrument: entry.instrument || 'Unknown'
        };
      });

    // Drawdown Analysis
    let peak = 0;
    let currentDrawdown = 0;
    let drawdownStartDate = '';
    let maxDrawdownPercent = 0;
    let maxDrawdownDate = '';
    let maxDrawdownRecoveryDays = 0;
    const drawdownPeriods: { start: string; end: string; days: number }[] = [];
    
    const drawdownData = pnlByDate.map((item, index) => {
      if (item.cumulative > peak) {
        if (currentDrawdown < 0 && drawdownStartDate) {
          drawdownPeriods.push({
            start: drawdownStartDate,
            end: pnlByDate[index - 1]?.date || item.date,
            days: index - pnlByDate.findIndex(d => d.date === drawdownStartDate)
          });
        }
        peak = item.cumulative;
        currentDrawdown = 0;
        drawdownStartDate = '';
      } else {
        if (currentDrawdown === 0) {
          drawdownStartDate = item.date;
        }
        currentDrawdown = peak - item.cumulative;
        const drawdownPercent = peak > 0 ? (currentDrawdown / peak) * 100 : 0;
        
        if (drawdownPercent > maxDrawdownPercent) {
          maxDrawdownPercent = drawdownPercent;
          maxDrawdownDate = item.date;
          maxDrawdownRecoveryDays = index - pnlByDate.findIndex(d => d.date === drawdownStartDate);
        }
      }
      
      const drawdownPercent = peak > 0 ? -(currentDrawdown / peak) * 100 : 0;
      const daysInDrawdown = drawdownStartDate ? index - pnlByDate.findIndex(d => d.date === drawdownStartDate) : 0;
      
      return {
        date: item.date,
        drawdownPercent,
        daysInDrawdown,
        peak
      };
    });

    const avgRecoveryTime = drawdownPeriods.length > 0 
      ? drawdownPeriods.reduce((sum, p) => sum + p.days, 0) / drawdownPeriods.length 
      : 0;

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
      profitFactor,
      instrumentPerformance,
      timeHeatmap,
      riskRewardScatter,
      drawdownData,
      maxDrawdown: { percent: maxDrawdownPercent, date: maxDrawdownDate, recoveryDays: maxDrawdownRecoveryDays },
      avgRecoveryTime
    };
  }, [entries, startDate, endDate]);
};
