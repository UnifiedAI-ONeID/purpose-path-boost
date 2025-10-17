-- Add performance indexes for analytics queries
-- These indexes optimize the dashboard-user-analytics edge function

-- Index for lesson_events queries by profile and date
CREATE INDEX IF NOT EXISTS idx_lesson_events_profile_created 
ON lesson_events(profile_id, created_at);

-- Index for me_sessions queries by profile and date
CREATE INDEX IF NOT EXISTS idx_me_sessions_profile_created 
ON me_sessions(profile_id, created_at);

-- Index for referrals queries by referrer and date
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_created 
ON referrals(referrer_profile_id, created_at);

-- Index for lesson_events event type filtering
CREATE INDEX IF NOT EXISTS idx_lesson_events_profile_ev 
ON lesson_events(profile_id, ev, created_at);

COMMENT ON INDEX idx_lesson_events_profile_created IS 'Optimizes analytics queries for lesson events by profile and date range';
COMMENT ON INDEX idx_me_sessions_profile_created IS 'Optimizes analytics queries for session bookings by profile and date range';
COMMENT ON INDEX idx_referrals_referrer_created IS 'Optimizes analytics queries for referral tracking by referrer and date range';
COMMENT ON INDEX idx_lesson_events_profile_ev IS 'Optimizes filtering lesson events by type (start, complete, watch_tick)';