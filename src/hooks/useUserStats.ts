import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserStats {
  totalForecasts: number;
  totalJournalEntries: number;
  winRate: number;
  totalViews: number;
  totalLikes: number;
  activeStreak: number;
}

export const useUserStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      if (!userId) {
        return {
          totalForecasts: 0,
          totalJournalEntries: 0,
          winRate: 0,
          totalViews: 0,
          totalLikes: 0,
          activeStreak: 0,
        };
      }

      // Fetch forecast count and likes
      const { data: forecastData, error: forecastError } = await supabase
        .from('forecasts')
        .select('id, likes_count, created_at')
        .eq('user_id', userId);

      if (forecastError) {
        console.error('Error fetching forecasts:', forecastError);
      }

      const forecastCount = forecastData?.length || 0;
      const totalLikes = forecastData?.reduce((sum, f) => sum + (f.likes_count || 0), 0) || 0;

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

      // Calculate active streak from recent activity
      let activeStreak = 0;
      if (forecastData && forecastData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dates = forecastData.map(f => {
          const date = new Date(f.created_at);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        });
        
        const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
        
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          checkDate.setHours(0, 0, 0, 0);
          
          if (uniqueDates.includes(checkDate.getTime())) {
            activeStreak++;
          } else if (i > 0) {
            break;
          }
        }
      }

      return {
        totalForecasts: forecastCount,
        totalJournalEntries: journalCount || 0,
        winRate,
        totalViews: totalLikes, // Using likes as a proxy for views
        totalLikes,
        activeStreak,
      } as UserStats;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};
