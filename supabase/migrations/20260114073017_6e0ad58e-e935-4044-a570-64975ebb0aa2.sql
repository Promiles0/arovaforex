-- Create live chat messages table
CREATE TABLE public.live_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stream_id UUID REFERENCES public.live_stream_config(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_live_chat_stream_id ON public.live_chat_messages(stream_id);
CREATE INDEX idx_live_chat_created_at ON public.live_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read non-deleted messages
CREATE POLICY "Users can view chat messages"
  ON public.live_chat_messages FOR SELECT
  TO authenticated
  USING (is_deleted = false);

-- Users can insert their own messages
CREATE POLICY "Users can send messages"
  ON public.live_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can update messages (pin/delete)
CREATE POLICY "Admins can update messages"
  ON public.live_chat_messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
  ON public.live_chat_messages FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;