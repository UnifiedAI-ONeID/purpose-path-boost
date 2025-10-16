-- Remove insecure is_admin columns from tables
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;
ALTER TABLE public.zg_profiles DROP COLUMN IF EXISTS is_admin;

-- Update the is_admin() function to use the secure zg_admins table
-- This maintains compatibility with existing RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.zg_admins 
    WHERE user_id = auth.uid()
  )
$$;

-- Ensure the parameterized version exists for API endpoints
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.zg_admins 
    WHERE user_id = _user_id
  )
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_zg_admins_user_id ON public.zg_admins(user_id);