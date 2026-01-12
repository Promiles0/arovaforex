-- Live Stream Configuration Table
CREATE TABLE public.live_stream_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id VARCHAR(100) NOT NULL DEFAULT '',
  is_live BOOLEAN DEFAULT FALSE,
  title VARCHAR(200) DEFAULT 'Live Trading Session',
  description TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one active config at a time
CREATE UNIQUE INDEX idx_single_config ON public.live_stream_config ((1));

-- Live Stream Views Analytics Table
CREATE TABLE public.live_stream_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id VARCHAR(100),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER
);

-- Create index for analytics queries
CREATE INDEX idx_live_stream_views_user ON public.live_stream_views(user_id);
CREATE INDEX idx_live_stream_views_video ON public.live_stream_views(video_id);

-- Enable RLS
ALTER TABLE public.live_stream_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_stream_config
CREATE POLICY "Anyone can view stream config"
  ON public.live_stream_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stream config"
  ON public.live_stream_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for live_stream_views
CREATE POLICY "Users can insert own views"
  ON public.live_stream_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own views"
  ON public.live_stream_views
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own views"
  ON public.live_stream_views
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all views"
  ON public.live_stream_views
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial config row
INSERT INTO public.live_stream_config (video_id, is_live, title, description)
VALUES ('', FALSE, 'Live Trading Session', 'Join our live trading sessions and interact in real-time');