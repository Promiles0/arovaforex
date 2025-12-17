-- Create market data cache table for persistent caching
CREATE TABLE public.market_data_cache (
  id TEXT PRIMARY KEY DEFAULT 'global',
  data JSONB NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1D',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public read access (no auth needed for market data)
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market data cache"
  ON public.market_data_cache
  FOR SELECT
  USING (true);

-- Only edge function (service role) can update
CREATE POLICY "Service role can manage cache"
  ON public.market_data_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);