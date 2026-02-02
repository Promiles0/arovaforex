import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface JournalSettings {
  id: string;
  user_id: string;
  // Display Preferences
  default_currency: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  entries_per_page: number;
  enable_animations: boolean;
  // Entry Defaults
  default_risk_reward_ratio: number;
  default_risk_percentage: number;
  default_position_size_method: 'percentage' | 'fixed' | 'units';
  require_screenshots: boolean;
  require_trade_plan: boolean;
  require_post_trade_review: boolean;
  auto_fill_last_values: boolean;
  // Privacy & Sharing
  journal_visibility: 'private' | 'mentors_only' | 'public';
  allow_mentors_view: boolean;
  allow_mentors_comment: boolean;
  share_statistics: boolean;
  anonymous_sharing: boolean;
  share_link: string | null;
  // Notifications
  notify_milestone_achieved: boolean;
  notify_weekly_summary: boolean;
  notify_monthly_report: boolean;
  notify_mentor_feedback: boolean;
  notify_goal_reminder: boolean;
  notify_inactivity: boolean;
  inactivity_days: number;
  notification_method: 'email' | 'in_app' | 'both' | 'disabled';
  weekly_summary_day: string;
  // Analytics Preferences
  show_emotion_tracking: boolean;
  show_advanced_metrics: boolean;
  track_trading_psychology: boolean;
  auto_calculate_statistics: boolean;
  enable_goal_tracking: boolean;
  monthly_profit_target: number | null;
  win_rate_target: number | null;
  max_drawdown_limit: number | null;
  // Data Management
  auto_backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  data_retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface BackupHistory {
  id: string;
  user_id: string;
  backup_type: 'manual' | 'automatic';
  backup_url: string;
  file_size: number;
  entries_count: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const defaultSettings: Omit<JournalSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  default_currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  entries_per_page: 20,
  enable_animations: true,
  default_risk_reward_ratio: 2.0,
  default_risk_percentage: 1.0,
  default_position_size_method: 'percentage',
  require_screenshots: false,
  require_trade_plan: false,
  require_post_trade_review: false,
  auto_fill_last_values: true,
  journal_visibility: 'private',
  allow_mentors_view: true,
  allow_mentors_comment: true,
  share_statistics: false,
  anonymous_sharing: false,
  share_link: null,
  notify_milestone_achieved: true,
  notify_weekly_summary: true,
  notify_monthly_report: true,
  notify_mentor_feedback: true,
  notify_goal_reminder: true,
  notify_inactivity: true,
  inactivity_days: 7,
  notification_method: 'both',
  weekly_summary_day: 'sunday',
  show_emotion_tracking: true,
  show_advanced_metrics: true,
  track_trading_psychology: true,
  auto_calculate_statistics: true,
  enable_goal_tracking: true,
  monthly_profit_target: null,
  win_rate_target: null,
  max_drawdown_limit: null,
  auto_backup_enabled: true,
  backup_frequency: 'weekly',
  data_retention_days: 365,
};

export function useJournalSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<JournalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingUpdatesRef = useRef<Partial<JournalSettings>>({});

  // Fetch settings on mount
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('journal_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings(data as JournalSettings);
          setLastSaved(new Date(data.updated_at));
        } else {
          // Create default settings for new user
          const { data: newSettings, error: createError } = await supabase
            .from('journal_settings')
            .insert({ user_id: user.id, ...defaultSettings })
            .select()
            .single();

          if (createError) throw createError;
          setSettings(newSettings as JournalSettings);
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user?.id]);

  // Debounced save function
  const debouncedSave = useCallback(async () => {
    if (!user?.id || Object.keys(pendingUpdatesRef.current).length === 0) return;

    setSaveStatus('saving');
    
    try {
      const { error } = await supabase
        .from('journal_settings')
        .update(pendingUpdatesRef.current)
        .eq('user_id', user.id);

      if (error) throw error;

      pendingUpdatesRef.current = {};
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      toast.error('Failed to save settings');
    }
  }, [user?.id]);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof JournalSettings>(
    key: K,
    value: JournalSettings[K]
  ) => {
    if (!settings) return;

    // Optimistic update
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
    
    // Queue the update
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      [key]: value,
    };

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule save after 1 second
    saveTimeoutRef.current = setTimeout(debouncedSave, 1000);
  }, [settings, debouncedSave]);

  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<JournalSettings>) => {
    if (!settings) return;

    // Optimistic update
    setSettings(prev => prev ? { ...prev, ...updates } : null);
    
    // Queue the updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule save after 1 second
    saveTimeoutRef.current = setTimeout(debouncedSave, 1000);
  }, [settings, debouncedSave]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    if (!user?.id) return;

    setSaveStatus('saving');
    
    try {
      const { data, error } = await supabase
        .from('journal_settings')
        .update(defaultSettings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data as JournalSettings);
      setSaveStatus('saved');
      setLastSaved(new Date());
      toast.success('Settings reset to defaults');
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error resetting settings:', error);
      setSaveStatus('error');
      toast.error('Failed to reset settings');
    }
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    settings,
    loading,
    saveStatus,
    lastSaved,
    updateSetting,
    updateSettings,
    resetToDefaults,
  };
}

// Hook for backup history
export function useBackupHistory() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackups = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('journal_backup_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBackups(data as BackupHistory[]);
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const createBackup = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch journal entries
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id);

      if (entriesError) throw entriesError;

      // Create backup data
      const backupData = {
        version: '1.0',
        created_at: new Date().toISOString(),
        entries_count: entries?.length || 0,
        entries,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const fileName = `${user.id}/backup-${Date.now()}.json`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('journal-backups')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Record in history
      const { error: historyError } = await supabase
        .from('journal_backup_history')
        .insert({
          user_id: user.id,
          backup_type: 'manual',
          backup_url: fileName,
          file_size: blob.size,
          entries_count: entries?.length || 0,
          status: 'completed',
        });

      if (historyError) throw historyError;

      toast.success('Backup created successfully!');
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  }, [user?.id, fetchBackups]);

  const deleteBackup = useCallback(async (backupId: string, backupUrl: string) => {
    if (!user?.id) return;

    try {
      // Delete from storage
      await supabase.storage.from('journal-backups').remove([backupUrl]);

      // Delete from history
      const { error } = await supabase
        .from('journal_backup_history')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      toast.success('Backup deleted');
      fetchBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup');
    }
  }, [user?.id, fetchBackups]);

  const downloadBackup = useCallback(async (backupUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('journal-backups')
        .download(backupUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupUrl.split('/').pop() || 'backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    }
  }, []);

  return {
    backups,
    loading,
    createBackup,
    deleteBackup,
    downloadBackup,
    refetch: fetchBackups,
  };
}
