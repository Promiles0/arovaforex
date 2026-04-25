-- Coach threads (conversations)
CREATE TABLE public.coach_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own coach threads" ON public.coach_threads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own coach threads" ON public.coach_threads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own coach threads" ON public.coach_threads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own coach threads" ON public.coach_threads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_coach_threads_user ON public.coach_threads(user_id, last_message_at DESC);

-- Coach messages
CREATE TABLE public.coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.coach_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own coach messages" ON public.coach_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own coach messages" ON public.coach_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own coach messages" ON public.coach_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_coach_messages_thread ON public.coach_messages(thread_id, created_at ASC);

-- Trigger to bump thread last_message_at
CREATE OR REPLACE FUNCTION public.bump_coach_thread()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.coach_threads
    SET last_message_at = NEW.created_at, updated_at = now()
    WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_coach_thread
AFTER INSERT ON public.coach_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_coach_thread();

CREATE TRIGGER trg_coach_threads_updated_at
BEFORE UPDATE ON public.coach_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
