-- Clean up orphaned profiles (profiles without auth users)
DELETE FROM public.zg_profiles
WHERE auth_user_id IS NULL OR auth_user_id NOT IN (
  SELECT id FROM auth.users
);

-- Add comment for documentation
COMMENT ON TABLE public.zg_profiles IS 'User profiles linked to auth.users. Cleaned orphaned records on 2025-10-17.';