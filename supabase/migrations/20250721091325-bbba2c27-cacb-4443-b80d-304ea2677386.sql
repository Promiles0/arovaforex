-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  country TEXT,
  phone_number TEXT,
  telegram_handle TEXT,
  whatsapp_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check user roles (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create forecasts table
CREATE TABLE public.forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('arova', 'public')),
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on forecasts
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

-- RLS policies for forecasts
CREATE POLICY "Anyone can view arova forecasts" 
ON public.forecasts 
FOR SELECT 
USING (forecast_type = 'arova');

CREATE POLICY "Users can view their own public forecasts" 
ON public.forecasts 
FOR SELECT 
USING (forecast_type = 'public' AND auth.uid() = user_id);

CREATE POLICY "Admins can insert arova forecasts" 
ON public.forecasts 
FOR INSERT 
WITH CHECK (forecast_type = 'arova' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert public forecasts" 
ON public.forecasts 
FOR INSERT 
WITH CHECK (forecast_type = 'public' AND auth.uid() = user_id);

CREATE POLICY "Admins can update arova forecasts" 
ON public.forecasts 
FOR UPDATE 
USING (forecast_type = 'arova' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own public forecasts" 
ON public.forecasts 
FOR UPDATE 
USING (forecast_type = 'public' AND auth.uid() = user_id);

-- Create forecast likes table
CREATE TABLE public.forecast_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_id UUID NOT NULL REFERENCES public.forecasts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, forecast_id)
);

-- Enable RLS on forecast_likes
ALTER TABLE public.forecast_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for forecast_likes
CREATE POLICY "Users can manage their own likes" 
ON public.forecast_likes 
FOR ALL 
USING (auth.uid() = user_id);

-- Function to update forecast likes count
CREATE OR REPLACE FUNCTION public.update_forecast_likes_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for forecast likes count
CREATE TRIGGER forecast_likes_count_trigger
  AFTER INSERT OR DELETE ON public.forecast_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forecast_likes_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forecasts_updated_at
  BEFORE UPDATE ON public.forecasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();