-- Add morning/evening journal slot and "went well" (evening) field.
-- Run in Supabase SQL Editor or via Supabase CLI.

ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS slot text DEFAULT 'evening';

ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS went_well jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.journal_entries.slot IS 'morning or evening; null/omit = evening (backward compat)';
COMMENT ON COLUMN public.journal_entries.went_well IS 'Evening journal: 3 things that went well. Morning uses gratitude.';
