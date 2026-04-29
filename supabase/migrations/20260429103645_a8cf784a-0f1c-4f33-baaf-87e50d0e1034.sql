-- Visitor tracking
CREATE TABLE public.visitor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id uuid NOT NULL,
  user_id uuid NULL,
  path text NOT NULL,
  full_url text,
  referrer text,
  user_agent text,
  ip_address inet,
  country text,
  city text,
  device_type text
);

CREATE INDEX idx_visitor_events_created_at ON public.visitor_events (created_at DESC);
CREATE INDEX idx_visitor_events_session ON public.visitor_events (session_id);
CREATE INDEX idx_visitor_events_path ON public.visitor_events (path);

ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visitor events"
  ON public.visitor_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view visitor events"
  ON public.visitor_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete visitor events"
  ON public.visitor_events FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_events;
ALTER TABLE public.visitor_events REPLICA IDENTITY FULL;

-- News enhancements: profile notification toggles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_news_digest boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_news_mention boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_ai_system boolean NOT NULL DEFAULT true;

-- Admins can moderate digest ratings
CREATE POLICY "Admins can update digest ratings"
  ON public.news_digest_ratings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete digest ratings"
  ON public.news_digest_ratings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Helper: dispatch digest notifications honoring per-user toggles & watchlist
CREATE OR REPLACE FUNCTION public.notify_digest_subscribers(p_digest_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d_date date;
  d_currencies text[];
  d_pairs text[];
  inserted_count integer := 0;
BEGIN
  SELECT digest_date INTO d_date FROM public.news_digests WHERE id = p_digest_id;
  IF d_date IS NULL THEN RETURN 0; END IF;

  -- Extract currencies and pairs from currency_impacts JSONB
  SELECT
    COALESCE(array_agg(DISTINCT upper(ci->>'currency')) FILTER (WHERE ci->>'currency' IS NOT NULL), '{}'),
    COALESCE(array_agg(DISTINCT upper(p)) FILTER (WHERE p IS NOT NULL), '{}')
  INTO d_currencies, d_pairs
  FROM public.news_digests nd,
       LATERAL jsonb_array_elements(nd.currency_impacts) ci
       LEFT JOIN LATERAL jsonb_array_elements_text(ci->'pairs') p ON true
  WHERE nd.id = p_digest_id;

  -- Pass 1: general "new digest" to opted-in users
  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT p.user_id,
         'system',
         '📰 Today''s AI News Digest is ready — ' || to_char(d_date, 'Mon DD, YYYY'),
         '/dashboard/news'
  FROM public.profiles p
  WHERE COALESCE(p.notify_news_digest, true) = true;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  -- Pass 2: personalized mentions for users whose watchlist overlaps
  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT w.user_id,
         'system',
         '⭐ Your watchlist is in today''s digest: ' ||
         array_to_string(
           ARRAY(
             SELECT unnest FROM unnest(
               (SELECT array_agg(DISTINCT x) FROM (
                 SELECT unnest(w.currencies) AS x
                 INTERSECT
                 SELECT unnest(d_currencies)
                 UNION
                 SELECT unnest(w.pairs)
                 INTERSECT
                 SELECT unnest(d_pairs)
               ) s)
             ) LIMIT 5
           ), ', '
         ),
         '/dashboard/news'
  FROM public.news_watchlist w
  JOIN public.profiles p ON p.user_id = w.user_id
  WHERE COALESCE(p.notify_news_mention, true) = true
    AND (
      (w.currencies && d_currencies) OR (w.pairs && d_pairs)
    );

  RETURN inserted_count;
END;
$$;