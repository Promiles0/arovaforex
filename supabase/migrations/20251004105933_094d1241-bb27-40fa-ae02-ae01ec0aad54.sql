-- Add hidden column for soft delete functionality
ALTER TABLE public.forecasts ADD COLUMN hidden BOOLEAN DEFAULT FALSE;

-- Create admin audit log table
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert audit logs
CREATE POLICY "Admins can create audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update forecasts RLS policies for better security
-- Drop old policies first
DROP POLICY IF EXISTS "Users can update their own public forecasts" ON public.forecasts;
DROP POLICY IF EXISTS "Users can insert public forecasts" ON public.forecasts;

-- Users can only update their own forecasts (not hidden ones)
CREATE POLICY "Users can update own forecasts"
ON public.forecasts
FOR UPDATE
USING (auth.uid() = user_id AND forecast_type = 'public' AND hidden = FALSE);

-- Users can only insert public forecasts
CREATE POLICY "Users can insert own forecasts"
ON public.forecasts
FOR INSERT
WITH CHECK (auth.uid() = user_id AND forecast_type = 'public');

-- Users can delete their own forecasts
CREATE POLICY "Users can delete own forecasts"
ON public.forecasts
FOR DELETE
USING (auth.uid() = user_id AND forecast_type = 'public');

-- Admins can do everything
CREATE POLICY "Admins have full access"
ON public.forecasts
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update viewing policies to exclude hidden forecasts for regular users
DROP POLICY IF EXISTS "Anyone can view public forecasts" ON public.forecasts;
DROP POLICY IF EXISTS "Anyone can view arova forecasts" ON public.forecasts;

CREATE POLICY "Users view non-hidden public forecasts"
ON public.forecasts
FOR SELECT
USING (
  forecast_type = 'public' 
  AND (hidden = FALSE OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users view non-hidden arova forecasts"
ON public.forecasts
FOR SELECT
USING (
  forecast_type = 'arova' 
  AND (hidden = FALSE OR has_role(auth.uid(), 'admin'))
);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action VARCHAR(50),
  p_target_type VARCHAR(50),
  p_target_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;