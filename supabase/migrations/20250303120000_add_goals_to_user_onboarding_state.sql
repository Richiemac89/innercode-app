-- Add goals column to user_onboarding_state so goals sync with Supabase and survive logout.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor) or via Supabase CLI.

ALTER TABLE public.user_onboarding_state
ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_onboarding_state.goals IS 'Array of user goals (SMART, value-aligned). Synced from InnerCode app.';
