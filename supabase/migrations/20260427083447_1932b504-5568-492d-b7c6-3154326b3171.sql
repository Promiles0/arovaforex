-- 1. Shared AI usage log for quotas
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature, day)
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai usage"
  ON public.ai_usage_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai usage"
  ON public.ai_usage_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ai usage"
  ON public.ai_usage_log FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Cached AI briefs for calendar events (shared, public read)
CREATE TABLE public.event_ai_briefs (
  event_id uuid PRIMARY KEY REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  brief text NOT NULL,
  model text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_ai_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read event briefs"
  ON public.event_ai_briefs FOR SELECT
  USING (true);

CREATE POLICY "Admins manage event briefs"
  ON public.event_ai_briefs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Service role / authenticated edge functions insert via service key — RLS bypassed.
-- For client-side fallback insert (not used in our flow but safe), allow authenticated insert:
CREATE POLICY "Authenticated can insert briefs"
  ON public.event_ai_briefs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Per-user weekly playbooks
CREATE TABLE public.playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  content jsonb NOT NULL,
  model text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own playbooks"
  ON public.playbooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own playbooks"
  ON public.playbooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own playbooks"
  ON public.playbooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own playbooks"
  ON public.playbooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_playbooks_updated_at
  BEFORE UPDATE ON public.playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_playbooks_user_week ON public.playbooks (user_id, week_start DESC);
CREATE INDEX idx_ai_usage_log_user_day ON public.ai_usage_log (user_id, day DESC);