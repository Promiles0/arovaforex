-- Fix security linter: set immutable search_path on new functions and add indexes + profile notification prefs

-- Replace create_notification with secure search_path
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_content TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, content, link)
  VALUES (p_user_id, p_type, p_content, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Replace notify_forecast_like with secure search_path
CREATE OR REPLACE FUNCTION public.notify_forecast_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  forecast_title TEXT;
  liker_name TEXT;
BEGIN
  SELECT f.title INTO forecast_title FROM public.forecasts f WHERE f.id = NEW.forecast_id;
  SELECT COALESCE(p.full_name, 'Someone') INTO liker_name FROM public.profiles p WHERE p.user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT f.user_id,
         'like',
         liker_name || ' liked your forecast' || COALESCE(': ' || forecast_title, ''),
         '/dashboard/forecasts#forecast-' || NEW.forecast_id::text
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id AND f.user_id != NEW.user_id;

  RETURN NEW;
END;
$$;

-- Replace notify_forecast_bookmark with secure search_path
CREATE OR REPLACE FUNCTION public.notify_forecast_bookmark()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  forecast_title TEXT;
  bookmarker_name TEXT;
BEGIN
  SELECT f.title INTO forecast_title FROM public.forecasts f WHERE f.id = NEW.forecast_id;
  SELECT COALESCE(p.full_name, 'Someone') INTO bookmarker_name FROM public.profiles p WHERE p.user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT f.user_id,
         'bookmark',
         bookmarker_name || ' bookmarked your forecast' || COALESCE(': ' || forecast_title, ''),
         '/dashboard/forecasts#forecast-' || NEW.forecast_id::text
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id AND f.user_id != NEW.user_id;

  RETURN NEW;
END;
$$;

-- Replace notify_forecast_comment with secure search_path
CREATE OR REPLACE FUNCTION public.notify_forecast_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  forecast_title TEXT;
  commenter_name TEXT;
BEGIN
  SELECT f.title INTO forecast_title FROM public.forecasts f WHERE f.id = NEW.forecast_id;
  SELECT COALESCE(p.full_name, 'Someone') INTO commenter_name FROM public.profiles p WHERE p.user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT f.user_id,
         'comment',
         commenter_name || ' commented on your forecast' || COALESCE(': ' || forecast_title, ''),
         '/dashboard/forecasts#forecast-' || NEW.forecast_id::text
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id AND f.user_id != NEW.user_id;

  RETURN NEW;
END;
$$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at 
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_isread 
  ON public.notifications (user_id, is_read);

-- Notification preference columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_like BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_bookmark BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_comment BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_announcement BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_system BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;
