-- Create profiles for existing authenticated users who don't have one yet
INSERT INTO public.zg_profiles (auth_user_id, locale, name, email, created_at)
SELECT 
  u.id,
  'en',
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  u.email,
  u.created_at
FROM auth.users u
WHERE u.id NOT IN (SELECT auth_user_id FROM public.zg_profiles WHERE auth_user_id IS NOT NULL)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Verify the trigger exists for future users
-- If not, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;