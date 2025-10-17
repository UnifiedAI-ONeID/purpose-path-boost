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

-- Secure policies remain active:
-- zg_profiles: 
--   - "Users can view own profile" (auth.uid() = auth_user_id)
--   - "Users can update own profile" (auth.uid() = auth_user_id)
--   - "Admins can view all profiles" (is_admin(auth.uid()))
--   - "Service role can create profiles" (service_role only)
--
-- lesson_progress:
--   - "own_progress_read" (profile_id = get_my_profile_id())
--   - "own_progress_insert" (profile_id = get_my_profile_id())
--   - "own_progress_update" (profile_id = get_my_profile_id())
--   - "Admins can view all progress" (is_admin())