-- Create chat_reactions table for message reactions
CREATE TABLE public.chat_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.live_chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create index for fast lookups
CREATE INDEX idx_chat_reactions_message ON public.chat_reactions(message_id);

-- Enable RLS
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view all reactions
CREATE POLICY "Users can view reactions"
  ON public.chat_reactions FOR SELECT
  TO authenticated
  USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
  ON public.chat_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
  ON public.chat_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add slow_mode column to live_stream_config
ALTER TABLE public.live_stream_config 
ADD COLUMN IF NOT EXISTS slow_mode_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS slow_mode_seconds INTEGER DEFAULT 30;

-- Enable realtime for chat_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;