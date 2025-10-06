-- Fix confidence_level check constraint to allow NULL values
-- and ensure proper range validation (1-10)

-- First, drop the existing constraint if it exists
ALTER TABLE public.journal_entries 
DROP CONSTRAINT IF EXISTS journal_entries_confidence_level_check;

-- Add new constraint that allows NULL or values between 1 and 10
ALTER TABLE public.journal_entries 
ADD CONSTRAINT journal_entries_confidence_level_check 
CHECK (
  confidence_level IS NULL OR 
  (confidence_level >= 1 AND confidence_level <= 10)
);

-- Set a sensible default value of 5 (medium confidence)
ALTER TABLE public.journal_entries 
ALTER COLUMN confidence_level SET DEFAULT 5;