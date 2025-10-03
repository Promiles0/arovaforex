-- Drop the existing constraint if misconfigured
ALTER TABLE public.forecasts
DROP CONSTRAINT IF EXISTS forecasts_user_id_fkey;

-- Recreate the foreign key relationship correctly
-- forecasts.user_id should reference profiles.user_id (not profiles.id)
ALTER TABLE public.forecasts
ADD CONSTRAINT forecasts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;