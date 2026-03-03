-- =========================================================
-- Migration: Add check-in history fields to user_onboarding_state
-- =========================================================
-- This migration adds support for storing weekly check-in history
-- and category history in the user_onboarding_state table.

-- Add check_in_history column (JSONB array of CheckInEntry objects)
ALTER TABLE public.user_onboarding_state
  ADD COLUMN IF NOT EXISTS check_in_history jsonb DEFAULT '[]'::jsonb;

-- Add category_history column (JSONB array of CategoryHistory objects)
ALTER TABLE public.user_onboarding_state
  ADD COLUMN IF NOT EXISTS category_history jsonb DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.user_onboarding_state.check_in_history IS 
  'Array of weekly check-in entries, each containing id, timestamp, ratings, and optional note';

COMMENT ON COLUMN public.user_onboarding_state.category_history IS 
  'Array of category score snapshots by date, used for tracking score trends over time';


