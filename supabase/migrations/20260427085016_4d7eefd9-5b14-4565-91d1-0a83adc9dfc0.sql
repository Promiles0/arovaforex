CREATE TABLE public.news_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date date NOT NULL UNIQUE,
  summary text NOT NULL,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  currency_impacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  event_count integer NOT NULL DEFAULT 0,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.news_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view news digests"
  ON public.news_digests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage news digests"
  ON public.news_digests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_news_digests_updated_at
  BEFORE UPDATE ON public.news_digests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_news_digests_date ON public.news_digests(digest_date DESC);