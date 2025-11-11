-- Add missing columns to contact_messages table
ALTER TABLE public.contact_messages
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS admin_response TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have a default name from email if needed
UPDATE public.contact_messages
SET name = COALESCE(name, split_part(email, '@', 1))
WHERE name IS NULL;

-- Make name required going forward
ALTER TABLE public.contact_messages
ALTER COLUMN name SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON public.contact_messages(category);
CREATE INDEX IF NOT EXISTS idx_contact_messages_responded_at ON public.contact_messages(responded_at DESC);