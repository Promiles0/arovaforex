-- Fix linter issues: enable RLS where missing and harden functions' search_path

-- 1) Harden has_role by setting a fixed search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 2) Harden trigger helper functions with fixed search_path
CREATE OR REPLACE FUNCTION public.update_forecast_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forecasts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.forecast_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forecasts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.forecast_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_forecast_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forecasts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.forecast_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forecasts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.forecast_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 3) Enable RLS and add policies for user_roles (RLS Enabled No Policy)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow admins to fully manage user roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage user roles'
  ) THEN
    CREATE POLICY "Admins can manage user roles" ON public.user_roles
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Optionally allow users to view their own roles (read-only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;
