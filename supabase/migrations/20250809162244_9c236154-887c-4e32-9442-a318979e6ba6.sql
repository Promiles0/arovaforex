-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'bookmark', 'comment', 'announcement', 'system')),
  content TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow admins to create announcement and system notifications
CREATE POLICY "Admins can create announcements" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  type IN ('announcement', 'system') AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create function to auto-generate notifications for forecast interactions
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_content TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger function for forecast likes
CREATE OR REPLACE FUNCTION public.notify_forecast_like()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  forecast_title TEXT;
  liker_name TEXT;
BEGIN
  -- Get forecast details and liker information
  SELECT f.title INTO forecast_title
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id;
  
  SELECT COALESCE(p.full_name, 'Someone') INTO liker_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Create notification for forecast owner
  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT 
    f.user_id,
    'like',
    liker_name || ' liked your forecast' || COALESCE(': ' || forecast_title, ''),
    '/dashboard/forecasts#forecast-' || NEW.forecast_id::text
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id AND f.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger function for forecast bookmarks
CREATE OR REPLACE FUNCTION public.notify_forecast_bookmark()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  forecast_title TEXT;
  bookmarker_name TEXT;
BEGIN
  -- Get forecast details and bookmarker information
  SELECT f.title INTO forecast_title
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id;
  
  SELECT COALESCE(p.full_name, 'Someone') INTO bookmarker_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Create notification for forecast owner
  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT 
    f.user_id,
    'bookmark',
    bookmarker_name || ' bookmarked your forecast' || COALESCE(': ' || forecast_title, ''),
    '/dashboard/forecasts#forecast-' || NEW.forecast_id::text
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id AND f.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger function for forecast comments
CREATE OR REPLACE FUNCTION public.notify_forecast_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  forecast_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get forecast details and commenter information
  SELECT f.title INTO forecast_title
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id;
  
  SELECT COALESCE(p.full_name, 'Someone') INTO commenter_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Create notification for forecast owner
  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT 
    f.user_id,
    'comment',
    commenter_name || ' commented on your forecast' || COALESCE(': ' || forecast_title, ''),
    '/dashboard/forecasts#forecast-' || NEW.forecast_id::text
  FROM public.forecasts f
  WHERE f.id = NEW.forecast_id AND f.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_notify_forecast_like
  AFTER INSERT ON public.forecast_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_forecast_like();

CREATE TRIGGER trigger_notify_forecast_bookmark
  AFTER INSERT ON public.user_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_forecast_bookmark();

CREATE TRIGGER trigger_notify_forecast_comment
  AFTER INSERT ON public.forecast_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_forecast_comment();

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;