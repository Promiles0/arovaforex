-- Add column to track the original query that triggered an unmatched response
ALTER TABLE assistant_chat_messages 
ADD COLUMN IF NOT EXISTS original_query TEXT;

-- Function to get assistant analytics
CREATE OR REPLACE FUNCTION get_assistant_analytics(
  p_days INTEGER DEFAULT 30
)
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
    'total_conversations', (
      SELECT COUNT(DISTINCT session_id) 
      FROM assistant_chat_messages 
      WHERE created_at >= start_date
    ),
    'total_messages', (
      SELECT COUNT(*) 
      FROM assistant_chat_messages 
      WHERE created_at >= start_date AND sender = 'user'
    ),
    'matched_messages', (
      SELECT COUNT(*) 
      FROM assistant_chat_messages 
      WHERE created_at >= start_date 
        AND sender = 'assistant' 
        AND matched_intent IS NOT NULL
    ),
    'unmatched_messages', (
      SELECT COUNT(*) 
      FROM assistant_chat_messages 
      WHERE created_at >= start_date 
        AND sender = 'assistant' 
        AND matched_intent IS NULL
    ),
    'unique_users', (
      SELECT COUNT(DISTINCT user_id) 
      FROM assistant_chat_messages 
      WHERE created_at >= start_date
    ),
    'top_intents', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT matched_intent as intent, COUNT(*) as count
        FROM assistant_chat_messages
        WHERE created_at >= start_date 
          AND matched_intent IS NOT NULL
        GROUP BY matched_intent
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'daily_usage', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE sender = 'user') as messages,
          COUNT(DISTINCT session_id) as sessions
        FROM assistant_chat_messages
        WHERE created_at >= start_date
        GROUP BY DATE(created_at)
        ORDER BY date
      ) t
    ),
    'unmatched_queries', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          id,
          original_query as query,
          created_at,
          user_id
        FROM assistant_chat_messages
        WHERE created_at >= start_date 
          AND sender = 'assistant' 
          AND matched_intent IS NULL
          AND original_query IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 50
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION get_assistant_analytics TO authenticated;