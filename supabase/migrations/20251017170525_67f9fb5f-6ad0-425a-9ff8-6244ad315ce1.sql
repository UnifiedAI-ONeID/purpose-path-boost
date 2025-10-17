-- Ensure zg_admins table exists with correct schema
DO $$ 
BEGIN
  -- Check if email column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'zg_admins' 
    AND column_name = 'email'
    AND is_nullable = 'NO'
  ) THEN
    -- Insert the first admin user with email
    INSERT INTO public.zg_admins (user_id, email)
    SELECT id, email FROM auth.users
    WHERE email = 'ac.acts29@gmail.com'
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
  ELSE
    -- Insert without email (if schema is different)
    INSERT INTO public.zg_admins (user_id)
    SELECT id FROM auth.users
    WHERE email = 'ac.acts29@gmail.com'
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.zg_admins ENABLE ROW LEVEL SECURITY;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_zg_admins_user_id ON public.zg_admins(user_id);