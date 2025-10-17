-- Security definer function to get profile_id from auth user
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.zg_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Lessons RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_read_published" ON lessons
FOR SELECT USING (published = true);

CREATE POLICY "admins_read_all_lessons" ON lessons
FOR SELECT USING (is_admin());

-- Lesson Progress RLS
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_progress_read" ON lesson_progress
FOR SELECT USING (profile_id = get_my_profile_id());

CREATE POLICY "own_progress_insert" ON lesson_progress
FOR INSERT WITH CHECK (profile_id = get_my_profile_id());

CREATE POLICY "own_progress_update" ON lesson_progress
FOR UPDATE USING (profile_id = get_my_profile_id());

-- Lesson Events RLS
ALTER TABLE lesson_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_lesson_events_insert" ON lesson_events
FOR INSERT WITH CHECK (profile_id = get_my_profile_id());

CREATE POLICY "admins_read_lesson_events" ON lesson_events
FOR SELECT USING (is_admin());

-- Subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_sub_read" ON subscriptions
FOR SELECT USING (profile_id = get_my_profile_id());

CREATE POLICY "admins_read_all_subs" ON subscriptions
FOR SELECT USING (is_admin());

-- Lesson Usage RLS
ALTER TABLE lesson_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_usage_read" ON lesson_usage
FOR SELECT USING (profile_id = get_my_profile_id());

CREATE POLICY "admins_read_all_usage" ON lesson_usage
FOR SELECT USING (is_admin());

-- Nudge Inbox RLS
ALTER TABLE nudge_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_nudges_read" ON nudge_inbox
FOR SELECT USING (profile_id = get_my_profile_id());

CREATE POLICY "own_nudges_update" ON nudge_inbox
FOR UPDATE USING (profile_id = get_my_profile_id());

-- Profile Badges RLS
ALTER TABLE profile_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_badges_read" ON profile_badges
FOR SELECT USING (profile_id = get_my_profile_id());

CREATE POLICY "admins_read_all_badges" ON profile_badges
FOR SELECT USING (is_admin());

-- Events RLS (already has some policies, adding if missing)
CREATE POLICY "events_read_published" ON events
FOR SELECT USING (status = 'published');

CREATE POLICY "admins_manage_events" ON events
FOR ALL USING (is_admin());

-- Coupons RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_read_active" ON coupons
FOR SELECT USING (active = true);

CREATE POLICY "admins_manage_coupons" ON coupons
FOR ALL USING (is_admin());

-- Referrals RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_read_own" ON referrals
FOR SELECT USING (referrer_profile_id = get_my_profile_id());

CREATE POLICY "admins_read_all_referrals" ON referrals
FOR SELECT USING (is_admin());

-- Plans RLS (make readable to all)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_read_active" ON plans
FOR SELECT USING (active = true);

CREATE POLICY "admins_manage_plans" ON plans
FOR ALL USING (is_admin());

-- Referral Settings RLS
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_settings_read_all" ON referral_settings
FOR SELECT USING (true);

CREATE POLICY "admins_manage_referral_settings" ON referral_settings
FOR ALL USING (is_admin());