-- Phase 1: Fix RLS policies on zg_profiles and clean up orphaned data

-- First, clean up orphaned profiles with NULL auth_user_id
DELETE FROM public.zg_profiles WHERE auth_user_id IS NULL;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can create profiles" ON public.zg_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.zg_profiles;

-- Create simplified, secure policy for profile creation
-- Service role can create any profile (used by edge function)
CREATE POLICY "Service role can create profiles" 
ON public.zg_profiles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Authenticated users can only create their own profile
CREATE POLICY "Users can create own profile" 
ON public.zg_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.zg_profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Add index for faster auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_zg_profiles_auth_user_id ON public.zg_profiles(auth_user_id);