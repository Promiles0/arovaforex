import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserStats {
  totalForecasts: number;
  totalJournalEntries: number;
  winRate: number;
}

export const useUserStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      if (!userId) {
        return {
          totalForecasts: 0,
          totalJournalEntries: 0,
          winRate: 0
        };
      }

      // Fetch forecast count
      const { count: forecastCount, error: forecastError } = await supabase
        .from('forecasts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (forecastError) {
        console.error('Error fetching forecasts:', forecastError);
      }

      // Fetch journal entries count
      const { count: journalCount, error: journalError } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (journalError) {
        console.error('Error fetching journal entries:', journalError);
      }

      // Calculate win rate from journal entries with outcome
      const { data: journalEntries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('outcome, pnl')
        .eq('user_id', userId)
        .not('outcome', 'is', null);

      if (entriesError) {
        console.error('Error fetching journal entries for win rate:', entriesError);
      }

      let winRate = 0;
      if (journalEntries && journalEntries.length > 0) {
        const wins = journalEntries.filter(entry => 
          entry.outcome?.toLowerCase() === 'win' || 
          entry.outcome?.toLowerCase() === 'profit' ||
          (entry.pnl !== null && entry.pnl > 0)
        ).length;
        winRate = Math.round((wins / journalEntries.length) * 100);
      }

      return {
        totalForecasts: forecastCount || 0,
        totalJournalEntries: journalCount || 0,
        winRate
      } as UserStats;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};
