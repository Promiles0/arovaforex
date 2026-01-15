-- Add reply columns to live_chat_messages
ALTER TABLE public.live_chat_messages
ADD COLUMN reply_to_id UUID REFERENCES public.live_chat_messages(id) ON DELETE SET NULL,
ADD COLUMN reply_preview TEXT;

-- Add clear_chat_on_end column to live_stream_config
ALTER TABLE public.live_stream_config
ADD COLUMN clear_chat_on_end BOOLEAN DEFAULT true;

-- Create index for faster reply lookups
CREATE INDEX idx_chat_messages_reply ON public.live_chat_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Create function to cleanup chat messages
CREATE OR REPLACE FUNCTION public.cleanup_chat_messages(p_stream_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete reactions for messages in this stream (except pinned)
  DELETE FROM public.chat_reactions 
  WHERE message_id IN (
    SELECT id FROM public.live_chat_messages 
    WHERE stream_id = p_stream_id AND is_pinned = FALSE
  );
  
  -- Delete non-pinned messages
  DELETE FROM public.live_chat_messages 
  WHERE stream_id = p_stream_id AND is_pinned = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create function for mention notifications
CREATE OR REPLACE FUNCTION public.notify_chat_mention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  mentioned_user_id UUID;
  mentioner_name TEXT;
  mention_pattern TEXT;
BEGIN
  -- Get mentioner's name
  SELECT COALESCE(p.full_name, p.telegram_handle, 'Someone') 
  INTO mentioner_name 
  FROM public.profiles p 
  WHERE p.user_id = NEW.user_id;

  -- Find all @username patterns in message
  FOR mention_pattern IN 
    SELECT DISTINCT (regexp_matches(NEW.message, '@([a-zA-Z0-9_]+)', 'g'))[1]
  LOOP
    -- Find user by telegram_handle (used as username)
    SELECT user_id INTO mentioned_user_id 
    FROM public.profiles 
    WHERE LOWER(telegram_handle) = LOWER(mention_pattern)
    LIMIT 1;
    
    -- Create notification if user found and not self-mention
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, content, link)
      VALUES (
        mentioned_user_id,
        'system',
        mentioner_name || ' mentioned you in live chat',
        '/dashboard/live-room'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for mention notifications
CREATE TRIGGER trigger_chat_mention_notification
AFTER INSERT ON public.live_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_chat_mention();