-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create rate limiting table for event registrations
CREATE TABLE IF NOT EXISTS event_registration_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'email')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, identifier_type, event_id)
);

CREATE INDEX idx_rate_limits_identifier ON event_registration_rate_limits(identifier, identifier_type, event_id);
CREATE INDEX idx_rate_limits_cleanup ON event_registration_rate_limits(last_attempt_at) WHERE blocked_until IS NOT NULL;

-- RLS policies for rate limits (admin only)
ALTER TABLE event_registration_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate limits"
  ON event_registration_rate_limits
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage rate limits"
  ON event_registration_rate_limits
  FOR ALL
  USING (is_admin());

-- Function to check and record rate limit
CREATE OR REPLACE FUNCTION check_event_registration_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_event_id UUID,
  p_max_attempts INTEGER DEFAULT 3,
  p_window_minutes INTEGER DEFAULT 5
) RETURNS JSONB AS $$
DECLARE
  v_record event_registration_rate_limits%ROWTYPE;
  v_window_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  v_window_start := v_now - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM event_registration_rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND event_id = p_event_id
  FOR UPDATE;
  
  -- Check if blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Too many attempts. Please try again later.',
      'blocked_until', v_record.blocked_until
    );
  END IF;
  
  -- Reset if outside window
  IF v_record.id IS NULL OR v_record.last_attempt_at < v_window_start THEN
    INSERT INTO event_registration_rate_limits (
      identifier, identifier_type, event_id, attempts, first_attempt_at, last_attempt_at
    ) VALUES (
      p_identifier, p_identifier_type, p_event_id, 1, v_now, v_now
    )
    ON CONFLICT (identifier, identifier_type, event_id) 
    DO UPDATE SET
      attempts = 1,
      first_attempt_at = v_now,
      last_attempt_at = v_now,
      blocked_until = NULL;
    
    RETURN jsonb_build_object('ok', true);
  END IF;
  
  -- Check if exceeded limit
  IF v_record.attempts >= p_max_attempts THEN
    UPDATE event_registration_rate_limits
    SET blocked_until = v_now + (p_window_minutes || ' minutes')::INTERVAL,
        last_attempt_at = v_now
    WHERE id = v_record.id;
    
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Too many attempts. Please try again in ' || p_window_minutes || ' minutes.',
      'blocked_until', v_now + (p_window_minutes || ' minutes')::INTERVAL
    );
  END IF;
  
  -- Increment attempts
  UPDATE event_registration_rate_limits
  SET attempts = attempts + 1,
      last_attempt_at = v_now
  WHERE id = v_record.id;
  
  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES zg_profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(profile_id, endpoint)
);

CREATE INDEX idx_push_subs_profile ON push_subscriptions(profile_id);
CREATE INDEX idx_push_subs_device ON push_subscriptions(device_id);

-- RLS for push subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (profile_id IN (
    SELECT id FROM zg_profiles WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM zg_profiles WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM zg_profiles WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (profile_id IN (
    SELECT id FROM zg_profiles WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (is_admin());

-- Trigger to update updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();