-- Create journal_settings table for user preferences
CREATE TABLE public.journal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Display Preferences
  default_currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  entries_per_page INTEGER DEFAULT 20,
  enable_animations BOOLEAN DEFAULT true,
  
  -- Entry Defaults  
  default_risk_reward_ratio DECIMAL DEFAULT 2.0,
  default_risk_percentage DECIMAL DEFAULT 1.0,
  default_position_size_method TEXT DEFAULT 'percentage' 
    CHECK (default_position_size_method IN ('percentage', 'fixed', 'units')),
  require_screenshots BOOLEAN DEFAULT false,
  require_trade_plan BOOLEAN DEFAULT false,
  require_post_trade_review BOOLEAN DEFAULT false,
  auto_fill_last_values BOOLEAN DEFAULT true,
  
  -- Privacy & Sharing
  journal_visibility TEXT DEFAULT 'private' 
    CHECK (journal_visibility IN ('private', 'mentors_only', 'public')),
  allow_mentors_view BOOLEAN DEFAULT true,
  allow_mentors_comment BOOLEAN DEFAULT true,
  share_statistics BOOLEAN DEFAULT false,
  anonymous_sharing BOOLEAN DEFAULT false,
  share_link TEXT,
  
  -- Notifications
  notify_milestone_achieved BOOLEAN DEFAULT true,
  notify_weekly_summary BOOLEAN DEFAULT true,
  notify_monthly_report BOOLEAN DEFAULT true,
  notify_mentor_feedback BOOLEAN DEFAULT true,
  notify_goal_reminder BOOLEAN DEFAULT true,
  notify_inactivity BOOLEAN DEFAULT true,
  inactivity_days INTEGER DEFAULT 7,
  notification_method TEXT DEFAULT 'both' 
    CHECK (notification_method IN ('email', 'in_app', 'both', 'disabled')),
  weekly_summary_day TEXT DEFAULT 'sunday',
  
  -- Analytics Preferences
  show_emotion_tracking BOOLEAN DEFAULT true,
  show_advanced_metrics BOOLEAN DEFAULT true,
  track_trading_psychology BOOLEAN DEFAULT true,
  auto_calculate_statistics BOOLEAN DEFAULT true,
  enable_goal_tracking BOOLEAN DEFAULT true,
  monthly_profit_target DECIMAL,
  win_rate_target DECIMAL,
  max_drawdown_limit DECIMAL,
  
  -- Data Management
  auto_backup_enabled BOOLEAN DEFAULT true,
  backup_frequency TEXT DEFAULT 'weekly' 
    CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  data_retention_days INTEGER DEFAULT 365,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.journal_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings"
  ON public.journal_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.journal_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.journal_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_journal_settings_user_id ON public.journal_settings(user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_journal_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_journal_settings_updated_at
  BEFORE UPDATE ON public.journal_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_settings_timestamp();

-- Create journal_backup_history table
CREATE TABLE public.journal_backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  backup_type TEXT CHECK (backup_type IN ('manual', 'automatic')),
  backup_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  entries_count INTEGER NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.journal_backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups"
  ON public.journal_backup_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backups"
  ON public.journal_backup_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON public.journal_backup_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_backup_history_user_id ON public.journal_backup_history(user_id);
CREATE INDEX idx_backup_history_created_at ON public.journal_backup_history(created_at DESC);

-- Create storage bucket for journal backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-backups', 'journal-backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for the bucket
CREATE POLICY "Users can upload own backups"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own backups storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'journal-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own backups storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );