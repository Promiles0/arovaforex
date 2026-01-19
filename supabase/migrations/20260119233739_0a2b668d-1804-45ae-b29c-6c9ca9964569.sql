-- Add priority column to contact_messages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'contact_messages' 
                 AND column_name = 'priority') THEN
    ALTER TABLE public.contact_messages ADD COLUMN priority TEXT DEFAULT 'normal';
  END IF;
END $$;

-- Add constraint for priority values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_priority_check') THEN
    ALTER TABLE public.contact_messages 
    ADD CONSTRAINT contact_messages_priority_check 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END $$;

-- Create contact_responses table for threaded conversations
CREATE TABLE IF NOT EXISTS public.contact_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.contact_messages(id) ON DELETE CASCADE NOT NULL,
  responder_type TEXT NOT NULL CHECK (responder_type IN ('admin', 'user')),
  responder_id UUID,
  responder_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on contact_responses
ALTER TABLE public.contact_responses ENABLE ROW LEVEL SECURITY;

-- Users can view responses to their messages
CREATE POLICY "Users can view responses to their messages"
  ON public.contact_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_messages
      WHERE contact_messages.id = contact_responses.message_id
      AND contact_messages.user_id = auth.uid()
    )
  );

-- Admins can view all responses
CREATE POLICY "Admins can view all responses"
  ON public.contact_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert responses
CREATE POLICY "Admins can insert responses"
  ON public.contact_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own follow-up responses
CREATE POLICY "Users can insert follow-up responses"
  ON public.contact_responses FOR INSERT
  WITH CHECK (
    responder_type = 'user' AND
    responder_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.contact_messages
      WHERE contact_messages.id = contact_responses.message_id
      AND contact_messages.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_responses_message_id 
  ON public.contact_responses(message_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority 
  ON public.contact_messages(priority);

-- Create function to get keyword effectiveness from real conversations
CREATE OR REPLACE FUNCTION get_keyword_effectiveness(p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  start_date TIMESTAMPTZ;
BEGIN
  start_date := NOW() - (p_days || ' days')::INTERVAL;
  
  SELECT json_build_object(
    'intent_frequency', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          matched_intent as intent,
          COUNT(*) as match_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM assistant_chat_messages
        WHERE created_at >= start_date 
          AND matched_intent IS NOT NULL
          AND matched_intent != ''
        GROUP BY matched_intent
        ORDER BY match_count DESC
        LIMIT 20
      ) t
    ),
    'unmatched_queries', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          original_query as query,
          COUNT(*) as frequency,
          MAX(created_at) as last_seen
        FROM assistant_chat_messages
        WHERE created_at >= start_date 
          AND original_query IS NOT NULL
          AND original_query != ''
          AND (matched_intent IS NULL OR matched_intent = '')
        GROUP BY original_query
        ORDER BY frequency DESC
        LIMIT 50
      ) t
    ),
    'match_rate_by_day', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE matched_intent IS NOT NULL AND matched_intent != '') as matched,
          COUNT(*) FILTER (WHERE (matched_intent IS NULL OR matched_intent = '') AND sender = 'user') as unmatched
        FROM assistant_chat_messages
        WHERE created_at >= start_date
        GROUP BY DATE(created_at)
        ORDER BY date
      ) t
    ),
    'total_stats', (
      SELECT json_build_object(
        'total_queries', COUNT(*) FILTER (WHERE sender = 'user'),
        'matched_queries', COUNT(*) FILTER (WHERE matched_intent IS NOT NULL AND matched_intent != ''),
        'unique_intents', COUNT(DISTINCT matched_intent) FILTER (WHERE matched_intent IS NOT NULL AND matched_intent != '')
      )
      FROM assistant_chat_messages
      WHERE created_at >= start_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$;