-- Update zg_profiles table for authentication
ALTER TABLE IF EXISTS zg_profiles
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tz text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS interests text[];

-- Create index for auth_user_id lookups
CREATE INDEX IF NOT EXISTS zg_profiles_auth_user_idx ON zg_profiles(auth_user_id);

-- Auto-create profile on signup trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.zg_profiles (auth_user_id, locale, name, email)
  VALUES (
    NEW.id, 
    'en',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for zg_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON zg_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON zg_profiles;
DROP POLICY IF EXISTS "Service can view all profiles" ON zg_profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON zg_profiles;

-- Users can view their own authenticated profile
CREATE POLICY "Users can view own profile" 
  ON zg_profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Users can update their own authenticated profile
CREATE POLICY "Users can update own profile" 
  ON zg_profiles FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Service role can view all profiles (for merging operations)
CREATE POLICY "Service can view all profiles" 
  ON zg_profiles FOR SELECT
  USING (true);

-- Service role can insert profiles (for anonymous users)
CREATE POLICY "Service can insert profiles" 
  ON zg_profiles FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars', 
  'user-avatars', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- RLS policies for storage
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );