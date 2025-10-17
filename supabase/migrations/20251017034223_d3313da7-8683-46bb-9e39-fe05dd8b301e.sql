-- Fix: Drop the actual policy with correct name
DROP POLICY IF EXISTS "Users can view own profile by device" ON public.zg_profiles;
DROP POLICY IF EXISTS "Users can update own profile by device" ON public.zg_profiles;