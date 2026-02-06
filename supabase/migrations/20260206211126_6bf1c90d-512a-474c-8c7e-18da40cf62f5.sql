-- =====================================================
-- Trading Journal Dual Mode System - Database Migration
-- =====================================================

-- 1. Create broker_connections table for auto-sync functionality
CREATE TABLE public.broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('metatrader', 'file_upload', 'email')),
  broker_name TEXT,
  account_number TEXT,
  connection_code TEXT UNIQUE,
  platform TEXT CHECK (platform IN ('mt4', 'mt5')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disconnected', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'realtime' CHECK (sync_frequency IN ('realtime', '5min', '15min', 'manual')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for broker_connections
ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" 
  ON public.broker_connections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" 
  ON public.broker_connections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" 
  ON public.broker_connections FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" 
  ON public.broker_connections FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX idx_broker_connections_user_id ON public.broker_connections(user_id);
CREATE INDEX idx_broker_connections_code ON public.broker_connections(connection_code);

-- 2. Create import_history table to track all trade import events
CREATE TABLE public.import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES public.broker_connections(id) ON DELETE SET NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('mt_sync', 'file_upload', 'email_import', 'manual')),
  source_name TEXT,
  trades_imported INTEGER DEFAULT 0,
  trades_skipped INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'partial', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for import_history
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import history" 
  ON public.import_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import history" 
  ON public.import_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_import_history_user_id ON public.import_history(user_id);
CREATE INDEX idx_import_history_created_at ON public.import_history(created_at DESC);

-- 3. Extend journal_settings table with mode and auto-sync preferences
ALTER TABLE public.journal_settings 
  ADD COLUMN IF NOT EXISTS journal_mode TEXT DEFAULT 'manual' 
    CHECK (journal_mode IN ('manual', 'auto')),
  ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_frequency TEXT DEFAULT 'realtime',
  ADD COLUMN IF NOT EXISTS skip_duplicates BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_categorize BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_trades BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS import_closed_only BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_auto_setup_complete BOOLEAN DEFAULT false;

-- 4. Extend journal_entries table to support auto-imported trades
ALTER TABLE public.journal_entries 
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS auto_imported BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_ticket TEXT,
  ADD COLUMN IF NOT EXISTS broker_name TEXT,
  ADD COLUMN IF NOT EXISTS notes_added BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trade_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS import_id UUID;

-- Create unique constraint to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_external_trade 
  ON public.journal_entries(user_id, external_ticket, broker_name) 
  WHERE external_ticket IS NOT NULL;

-- Create trigger to update updated_at on broker_connections
CREATE TRIGGER update_broker_connections_updated_at
  BEFORE UPDATE ON public.broker_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();