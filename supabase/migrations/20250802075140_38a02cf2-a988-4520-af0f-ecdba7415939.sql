-- Fix RLS policy to allow anyone to view public forecasts
DROP POLICY IF EXISTS "Users can view their own public forecasts" ON public.forecasts;

-- Create new policy to allow anyone to view public forecasts
CREATE POLICY "Anyone can view public forecasts" 
ON public.forecasts 
FOR SELECT 
USING (forecast_type = 'public');

-- Keep the policy for users to view their own arova forecasts
-- No change needed for arova forecasts policy - it's already correct