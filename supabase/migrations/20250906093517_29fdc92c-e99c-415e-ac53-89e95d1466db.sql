-- Create journal_entries table for trader journal functionality
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Entry metadata
  title TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME,
  
  -- Trading details
  instrument TEXT,
  direction TEXT CHECK (direction IN ('long', 'short', 'neutral')),
  entry_price DECIMAL(10,5),
  exit_price DECIMAL(10,5),
  quantity DECIMAL(10,4),
  stop_loss DECIMAL(10,5),
  take_profit DECIMAL(10,5),
  
  -- Analysis and reflection
  setup_description TEXT,
  market_analysis TEXT,
  trade_rationale TEXT,
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'breakeven', 'open')),
  lessons_learned TEXT,
  emotions TEXT,
  
  -- Media and attachments
  chart_screenshot_url TEXT,
  chart_screenshot_urls TEXT[], -- For multiple screenshots
  
  -- Categorization
  tags TEXT[],
  setup_type TEXT, -- breakout, trendline bounce, etc.
  session TEXT, -- london, new_york, asia, overlap
  
  -- Performance metrics
  pnl DECIMAL(10,2),
  risk_reward_ratio DECIMAL(4,2),
  win_rate DECIMAL(5,2),
  
  -- Draft functionality
  is_draft BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  
  -- Webhook data
  webhook_data JSONB,
  external_id TEXT -- for linking with external systems
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own journal entries" 
ON public.journal_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries" 
ON public.journal_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" 
ON public.journal_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" 
ON public.journal_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view shared entries
CREATE POLICY "Admins can view shared journal entries" 
ON public.journal_entries 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND is_shared = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX idx_journal_entries_entry_date ON public.journal_entries(entry_date);
CREATE INDEX idx_journal_entries_tags ON public.journal_entries USING GIN(tags);
CREATE INDEX idx_journal_entries_instrument ON public.journal_entries(instrument);
CREATE INDEX idx_journal_entries_outcome ON public.journal_entries(outcome);

-- Create calendar_events table for real calendar data
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  category TEXT NOT NULL CHECK (category IN ('market_event', 'academy', 'signal', 'forecast', 'webinar')),
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Additional metadata
  timezone TEXT DEFAULT 'GMT',
  currency_pairs TEXT[],
  external_url TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT -- daily, weekly, monthly
);

-- Enable RLS for calendar events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view calendar events
CREATE POLICY "Anyone can view calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (true);

-- Only admins can manage calendar events
CREATE POLICY "Admins can manage calendar events" 
ON public.calendar_events 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for calendar events timestamp updates
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample calendar events
INSERT INTO public.calendar_events (title, description, event_date, event_time, category, impact, currency_pairs) VALUES
('US Non-Farm Payrolls', 'Monthly employment report showing the number of jobs added or lost in the US economy.', CURRENT_DATE + INTERVAL '1 day', '08:30:00', 'market_event', 'high', ARRAY['USD']),
('EUR/USD Weekly Analysis', 'Weekly technical and fundamental analysis for EUR/USD pair.', CURRENT_DATE + INTERVAL '3 days', '10:00:00', 'forecast', 'medium', ARRAY['EUR/USD']),
('Live Trading Session', 'Interactive trading session with our senior analysts.', CURRENT_DATE + INTERVAL '5 days', '14:00:00', 'academy', 'low', NULL),
('Federal Reserve Meeting', 'FOMC meeting with potential interest rate decision.', CURRENT_DATE + INTERVAL '7 days', '14:00:00', 'market_event', 'high', ARRAY['USD']),
('Risk Management Webinar', 'Educational webinar on effective risk management strategies.', CURRENT_DATE + INTERVAL '10 days', '16:00:00', 'webinar', 'medium', NULL),
('GBP/JPY Signal Alert', 'Premium trading signal for GBP/JPY with entry and exit levels.', CURRENT_DATE + INTERVAL '2 days', '09:30:00', 'signal', 'medium', ARRAY['GBP/JPY']);

-- Create indexes for calendar events
CREATE INDEX idx_calendar_events_date ON public.calendar_events(event_date);
CREATE INDEX idx_calendar_events_category ON public.calendar_events(category);
CREATE INDEX idx_calendar_events_impact ON public.calendar_events(impact);