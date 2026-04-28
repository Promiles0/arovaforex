-- Watchlist
CREATE TABLE public.news_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  currencies text[] NOT NULL DEFAULT '{}',
  pairs text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.news_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own watchlist" ON public.news_watchlist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own watchlist" ON public.news_watchlist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own watchlist" ON public.news_watchlist
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own watchlist" ON public.news_watchlist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_news_watchlist_updated_at
  BEFORE UPDATE ON public.news_watchlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ratings
CREATE TABLE public.news_digest_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating text NOT NULL CHECK (rating IN ('up','down')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (digest_id, user_id)
);

ALTER TABLE public.news_digest_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ratings" ON public.news_digest_ratings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone authenticated can read aggregate ratings" ON public.news_digest_ratings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins view all ratings" ON public.news_digest_ratings
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own ratings" ON public.news_digest_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ratings" ON public.news_digest_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ratings" ON public.news_digest_ratings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_news_digest_ratings_updated_at
  BEFORE UPDATE ON public.news_digest_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_news_digest_ratings_digest ON public.news_digest_ratings(digest_id);