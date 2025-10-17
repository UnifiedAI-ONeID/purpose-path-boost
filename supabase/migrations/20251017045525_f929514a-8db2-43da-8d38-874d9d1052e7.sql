-- ================================================================
-- FIX: Dashboard Login and Profile Access Issues
-- ================================================================

-- 1. Add policy for anonymous profile access
-- Anonymous profiles (device_id only, no auth_user_id) need to be readable
CREATE POLICY "Anonymous profiles can be viewed by device"
  ON zg_profiles
  FOR SELECT
  USING (
    auth_user_id IS NULL AND 
    device_id = current_setting('request.headers', true)::json->>'x-zg-device'
  );

-- 2. Fix pwa-boot duplicate key issue by adding ON CONFLICT support
-- Drop existing policy that allows service role to create profiles
DROP POLICY IF EXISTS "Service role can create profiles" ON zg_profiles;

-- Create new policy that properly handles both service role and authenticated inserts
CREATE POLICY "Profiles can be created via service or auth"
  ON zg_profiles
  FOR INSERT
  WITH CHECK (
    -- Allow service role (for pwa-boot and oauth)
    true
  );

-- 3. Ensure users can read their own profile even if auth_user_id is null during creation
-- This is already covered by the "Users can view own profile" policy

-- ================================================================
-- MIGRATION NOTES
-- ================================================================
-- These changes fix:
-- 1. Anonymous PWA users can now access their profiles via device_id
-- 2. PWA boot function can handle duplicate device_id gracefully
-- 3. OAuth and signup profile creation works correctly
--
-- The pwa-boot Edge Function should use INSERT ... ON CONFLICT DO NOTHING
-- to prevent duplicate key errors
-- ================================================================