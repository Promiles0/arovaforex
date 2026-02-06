import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type JournalMode = 'manual' | 'auto';

interface UseJournalModeReturn {
  mode: JournalMode;
  setMode: (mode: JournalMode) => Promise<void>;
  isFirstTimeAuto: boolean;
  hasConnections: boolean;
  isLoading: boolean;
  isTransitioning: boolean;
}

export function useJournalMode(): UseJournalModeReturn {
  const { user } = useAuth();
  const [mode, setModeState] = useState<JournalMode>('manual');
  const [isFirstTimeAuto, setIsFirstTimeAuto] = useState(true);
  const [hasConnections, setHasConnections] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch initial mode and connection status
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchModeAndConnections = async () => {
      try {
        // Fetch journal settings for mode
        const { data: settings, error: settingsError } = await supabase
          .from('journal_settings')
          .select('journal_mode, first_auto_setup_complete')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsError) throw settingsError;

        if (settings) {
          setModeState((settings.journal_mode as JournalMode) || 'manual');
          setIsFirstTimeAuto(!settings.first_auto_setup_complete);
        }

        // Check if user has any broker connections
        const { data: connections, error: connectionsError } = await supabase
          .from('broker_connections')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (connectionsError) throw connectionsError;

        setHasConnections((connections?.length || 0) > 0);
      } catch (error) {
        console.error('Error fetching journal mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModeAndConnections();
  }, [user?.id]);

  // Set mode with animation transition
  const setMode = useCallback(async (newMode: JournalMode) => {
    if (!user?.id || newMode === mode) return;

    setIsTransitioning(true);
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('journal_settings')
        .update({ journal_mode: newMode })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state after a brief delay for animation
      setTimeout(() => {
        setModeState(newMode);
        setIsTransitioning(false);
      }, 300);

      // Store in localStorage as backup
      localStorage.setItem('journalMode', newMode);
    } catch (error) {
      console.error('Error updating journal mode:', error);
      toast.error('Failed to update mode');
      setIsTransitioning(false);
    }
  }, [user?.id, mode]);

  // Mark first auto setup as complete
  const markFirstAutoSetupComplete = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('journal_settings')
        .update({ first_auto_setup_complete: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setIsFirstTimeAuto(false);
    } catch (error) {
      console.error('Error marking setup complete:', error);
    }
  }, [user?.id]);

  return {
    mode,
    setMode,
    isFirstTimeAuto,
    hasConnections,
    isLoading,
    isTransitioning,
  };
}
