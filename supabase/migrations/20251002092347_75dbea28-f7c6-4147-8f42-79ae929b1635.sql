-- Increase precision for journal_entries numeric fields to handle larger values
-- Previous: numeric(10,5) - max value ~99,999.99999
-- New: numeric(20,8) - max value ~999,999,999,999.99999999

ALTER TABLE public.journal_entries
  ALTER COLUMN entry_price TYPE numeric(20,8),
  ALTER COLUMN exit_price TYPE numeric(20,8),
  ALTER COLUMN quantity TYPE numeric(20,8),
  ALTER COLUMN stop_loss TYPE numeric(20,8),
  ALTER COLUMN take_profit TYPE numeric(20,8),
  ALTER COLUMN pnl TYPE numeric(20,8),
  ALTER COLUMN risk_reward_ratio TYPE numeric(10,4),
  ALTER COLUMN commission TYPE numeric(20,8),
  ALTER COLUMN swap TYPE numeric(20,8);

COMMENT ON COLUMN public.journal_entries.entry_price IS 'Entry price with increased precision for crypto and large positions';
COMMENT ON COLUMN public.journal_entries.exit_price IS 'Exit price with increased precision for crypto and large positions';
COMMENT ON COLUMN public.journal_entries.pnl IS 'Profit/Loss with increased precision to handle large trade values';