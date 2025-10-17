-- Remove overly permissive legacy RLS policies on zg_profiles
-- These policies use 'using (true)' which bypasses all security checks
DROP POLICY IF EXISTS "Anyone can view own profile by device" ON public.zg_profiles;
DROP POLICY IF EXISTS "Anyone can update own profile by device" ON public.zg_profiles;
DROP POLICY IF EXISTS "Service can view all profiles" ON public.zg_profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON public.zg_profiles;

-- Remove duplicate legacy policies on lesson_progress
DROP POLICY IF EXISTS "Users can view own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.lesson_progress;