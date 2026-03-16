
-- Add onboarding_tour_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_tour_completed boolean DEFAULT false;

-- Create trigger function to notify premium users when new signal is published
CREATE OR REPLACE FUNCTION public.notify_new_signal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT p.user_id,
         'system',
         '📊 New ' || NEW.signal_type || ' signal: ' || NEW.currency_pair || ' (' || NEW.confidence || ' confidence)',
         '/dashboard/signals'
  FROM public.profiles p
  WHERE p.subscription_tier IN ('premium', 'professional')
    AND p.notify_system = true;

  RETURN NEW;
END;
$$;

-- Create trigger on trading_signals INSERT
DROP TRIGGER IF EXISTS on_new_signal_notify ON public.trading_signals;
CREATE TRIGGER on_new_signal_notify
  AFTER INSERT ON public.trading_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_signal();
