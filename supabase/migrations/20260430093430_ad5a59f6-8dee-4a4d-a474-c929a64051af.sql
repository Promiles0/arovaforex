
ALTER TABLE public.visitor_events
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'pageview',
  ADD COLUMN IF NOT EXISTS element_tag text,
  ADD COLUMN IF NOT EXISTS element_text text,
  ADD COLUMN IF NOT EXISTS element_href text,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS browser text;

CREATE INDEX IF NOT EXISTS idx_visitor_events_session_created ON public.visitor_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_events_user ON public.visitor_events (user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_type ON public.visitor_events (event_type);
CREATE INDEX IF NOT EXISTS idx_visitor_events_created ON public.visitor_events (created_at DESC);

DROP VIEW IF EXISTS public.visitor_sessions_summary;
CREATE VIEW public.visitor_sessions_summary
WITH (security_invoker = true)
AS
SELECT
  ve.session_id,
  (array_agg(ve.user_id) FILTER (WHERE ve.user_id IS NOT NULL))[1] AS user_id,
  MIN(ve.created_at) AS first_seen,
  MAX(ve.created_at) AS last_seen,
  COUNT(*) FILTER (WHERE ve.event_type = 'pageview') AS pageviews,
  COUNT(*) FILTER (WHERE ve.event_type = 'click') AS clicks,
  COALESCE(SUM(ve.duration_ms) FILTER (WHERE ve.event_type = 'pageleave'), 0) AS total_duration_ms,
  (array_agg(ve.country ORDER BY ve.created_at DESC) FILTER (WHERE ve.country IS NOT NULL))[1] AS country,
  (array_agg(ve.city ORDER BY ve.created_at DESC) FILTER (WHERE ve.city IS NOT NULL))[1] AS city,
  (array_agg(ve.device_type ORDER BY ve.created_at DESC) FILTER (WHERE ve.device_type IS NOT NULL))[1] AS device_type,
  (array_agg(ve.browser ORDER BY ve.created_at DESC) FILTER (WHERE ve.browser IS NOT NULL))[1] AS browser,
  (array_agg(ve.referrer ORDER BY ve.created_at ASC) FILTER (WHERE ve.referrer IS NOT NULL))[1] AS referrer,
  (array_agg(ve.path ORDER BY ve.created_at DESC) FILTER (WHERE ve.event_type = 'pageview'))[1] AS last_path
FROM public.visitor_events ve
GROUP BY ve.session_id;

GRANT SELECT ON public.visitor_sessions_summary TO authenticated;
