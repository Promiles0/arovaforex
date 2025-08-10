-- Create academy_content table
CREATE TABLE IF NOT EXISTS public.academy_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.academy_content ENABLE ROW LEVEL SECURITY;

-- Policies for academy_content
CREATE POLICY "Anyone can view published academy content"
ON public.academy_content
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage academy content"
ON public.academy_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on academy_content
CREATE TRIGGER trg_academy_content_updated_at
BEFORE UPDATE ON public.academy_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies for contact_messages
CREATE POLICY "Users can create their contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their contact messages"
ON public.contact_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all contact messages"
ON public.contact_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all contact messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on contact_messages
CREATE TRIGGER trg_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin-wide profiles access policies
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Full CRUD for forecasts of type 'arova' (add DELETE)
CREATE POLICY "Admins can delete arova forecasts"
ON public.forecasts
FOR DELETE
USING ((forecast_type = 'arova'::text) AND has_role(auth.uid(), 'admin'::app_role));

-- Broadcast notification function using existing notifications table and user preferences
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  p_type text,
  p_content text,
  p_link text DEFAULT NULL,
  p_user_ids uuid[] DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  inserted_count integer;
BEGIN
  IF p_user_ids IS NULL THEN
    INSERT INTO public.notifications (user_id, type, content, link)
    SELECT p.user_id, p_type, p_content, p_link
    FROM public.profiles p
    WHERE COALESCE(
      CASE p_type
        WHEN 'announcement' THEN p.notify_announcement
        WHEN 'system' THEN p.notify_system
        WHEN 'like' THEN p.notify_like
        WHEN 'bookmark' THEN p.notify_bookmark
        WHEN 'comment' THEN p.notify_comment
        ELSE true
      END, true
    ) = true;
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  ELSE
    INSERT INTO public.notifications (user_id, type, content, link)
    SELECT uid, p_type, p_content, p_link
    FROM unnest(p_user_ids) AS uid;
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;
  RETURN inserted_count;
END;
$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);
