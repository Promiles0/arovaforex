-- Create storage bucket for forecast images
INSERT INTO storage.buckets (id, name, public) VALUES ('forecasts', 'forecasts', true);

-- Create storage policies for forecast uploads
CREATE POLICY "Users can view forecast images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'forecasts');

CREATE POLICY "Users can upload forecast images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'forecasts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own forecast images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'forecasts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own forecast images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'forecasts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add new columns to forecasts table for trading context
ALTER TABLE public.forecasts 
ADD COLUMN currency_pair TEXT,
ADD COLUMN trade_bias TEXT CHECK (trade_bias IN ('long', 'short', 'neutral')),
ADD COLUMN commentary TEXT,
ADD COLUMN comments_count INTEGER DEFAULT 0;

-- Create forecast_comments table
CREATE TABLE public.forecast_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_id UUID NOT NULL REFERENCES public.forecasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on forecast_comments
ALTER TABLE public.forecast_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for forecast_comments
CREATE POLICY "Anyone can view comments" 
ON public.forecast_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.forecast_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.forecast_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.forecast_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create user_bookmarks table
CREATE TABLE public.user_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  forecast_id UUID NOT NULL REFERENCES public.forecasts(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, forecast_id)
);

-- Enable RLS on user_bookmarks
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for user_bookmarks
CREATE POLICY "Users can manage their own bookmarks" 
ON public.user_bookmarks 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update comments count
CREATE OR REPLACE FUNCTION public.update_forecast_comments_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for comments count
CREATE TRIGGER update_forecast_comments_count_trigger
  AFTER INSERT OR DELETE ON public.forecast_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forecast_comments_count();

-- Add trigger for updated_at on comments
CREATE TRIGGER update_forecast_comments_updated_at
  BEFORE UPDATE ON public.forecast_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();