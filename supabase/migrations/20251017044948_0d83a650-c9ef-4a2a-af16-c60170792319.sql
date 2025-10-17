-- ================================================================
-- SECURITY FIXES: RLS Policies and PII Protection
-- ================================================================

-- 1. Add admin-only RLS policy to integration_secrets table
-- This table stores encrypted API keys and must only be accessible to admins
CREATE POLICY "Admins can manage secrets"
  ON integration_secrets
  FOR ALL
  USING (is_admin());

-- 2. Tighten bookings table RLS policy
-- Replace overly broad "true" policy with proper token validation
DROP POLICY IF EXISTS "Users can view own bookings by token" ON bookings;

CREATE POLICY "Users can view own bookings by token"
  ON bookings
  FOR SELECT
  USING (
    -- Only allow access if the booking_token in the table matches the token in the request
    -- This prevents enumeration attacks where attackers guess booking tokens
    booking_token IS NOT NULL AND 
    booking_token = current_setting('request.headers', true)::json->>'x-booking-token'
  );

-- 3. Tighten event_regs table RLS policy
-- Replace overly broad "true" policy with proper checkin_code validation
DROP POLICY IF EXISTS "Users can view own registrations by checkin code" ON event_regs;

CREATE POLICY "Users can view own registrations by checkin code"
  ON event_regs
  FOR SELECT
  USING (
    -- Only allow access if the checkin_code matches the one in the request header
    -- This prevents attackers from enumerating registration data
    checkin_code IS NOT NULL AND 
    checkin_code = current_setting('request.headers', true)::json->>'x-checkin-code'
  );

-- 4. Add rate limiting comment to leads table
-- The INSERT policy "Anyone can submit lead" is intentionally permissive
-- but relies on Edge Function rate limiting (already implemented in api-events-register)
COMMENT ON POLICY "Anyone can submit lead" ON leads IS 
  'Public lead submission enabled. Rate limiting enforced at Edge Function level (registration_attempts table).';

-- ================================================================
-- SECURITY DOCUMENTATION
-- ================================================================
-- These changes address:
-- 1. Missing RLS policies on integration_secrets (CRITICAL)
-- 2. PII exposure via weak RLS policies on bookings and event_regs (CRITICAL)
-- 3. Proper token-based access validation to prevent enumeration attacks
--
-- Additional security measures already in place:
-- - Webhook signature verification (HMAC-SHA256)
-- - Input validation with Zod schemas
-- - Admin authentication with requireAdmin() helper
-- - AES-GCM encryption for secrets
-- - Error message sanitization
-- ================================================================