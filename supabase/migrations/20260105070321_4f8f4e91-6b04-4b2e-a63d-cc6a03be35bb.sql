-- Create a function to get public platform stats (bypasses RLS for aggregate counts)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  users_count INTEGER;
  forecasts_count INTEGER;
  active_this_month INTEGER;
  avg_win_rate NUMERIC;
  wins INTEGER;
  total_trades INTEGER;
BEGIN
  -- Total registered users
  SELECT COUNT(*) INTO users_count FROM profiles;
  
  -- Total forecasts
  SELECT COUNT(*) INTO forecasts_count FROM forecasts WHERE hidden = false;
  
  -- Active users this month (users with journal entries this month)
  SELECT COUNT(DISTINCT user_id) INTO active_this_month 
  FROM journal_entries 
  WHERE created_at >= date_trunc('month', CURRENT_DATE);
  
  -- Calculate average win rate from journal entries
  SELECT 
    COUNT(*) FILTER (WHERE outcome = 'win'),
    COUNT(*)
  INTO wins, total_trades
  FROM journal_entries 
  WHERE outcome IS NOT NULL AND outcome IN ('win', 'loss');
  
  IF total_trades > 0 THEN
    avg_win_rate := ROUND((wins::NUMERIC / total_trades::NUMERIC) * 100);
  ELSE
    avg_win_rate := 0;
  END IF;
  
  result := json_build_object(
    'users_count', users_count,
    'forecasts_count', forecasts_count,
    'active_this_month', active_this_month,
    'avg_win_rate', avg_win_rate
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to anonymous users (for public homepage)
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;