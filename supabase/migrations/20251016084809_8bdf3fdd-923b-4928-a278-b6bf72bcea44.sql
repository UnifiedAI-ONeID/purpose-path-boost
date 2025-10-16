-- Nudges/In-app messages queue
CREATE TABLE IF NOT EXISTS public.nudge_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('toast', 'banner', 'modal')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_label TEXT,
  cta_href TEXT,
  expire_at TIMESTAMPTZ NOT NULL,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nudge_inbox_profile_unseen ON public.nudge_inbox(profile_id, seen) WHERE seen = false;
CREATE INDEX IF NOT EXISTS idx_nudge_inbox_expires ON public.nudge_inbox(expire_at) WHERE seen = false;

ALTER TABLE public.nudge_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nudges" ON public.nudge_inbox
  FOR SELECT USING (true);

CREATE POLICY "Service can insert nudges" ON public.nudge_inbox
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update nudges" ON public.nudge_inbox
  FOR UPDATE USING (true);

-- Badges (gamification)
CREATE TABLE IF NOT EXISTS public.badges (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS public.profile_badges (
  profile_id UUID NOT NULL,
  badge_code TEXT NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (profile_id, badge_code)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Users can view own badges" ON public.profile_badges
  FOR SELECT USING (true);

CREATE POLICY "Service can award badges" ON public.profile_badges
  FOR INSERT WITH CHECK (true);

-- Insert default badges
INSERT INTO public.badges (code, title, description, icon) VALUES
  ('streak_7', '7-day Momentum', 'Showed up 7 days in a row', '🌱'),
  ('first_booking', 'First Session', 'Booked your first session', '🎉'),
  ('all_access', 'All-Access', 'Upgraded to Growth or Pro', '✨'),
  ('ref_1', 'First Referral', 'Invited a friend', '🤝')
ON CONFLICT (code) DO NOTHING;

-- Experiments (A/B testing)
CREATE TABLE IF NOT EXISTS public.experiments (
  key TEXT PRIMARY KEY,
  variants TEXT[] NOT NULL,
  enabled BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.experiment_assignments (
  profile_id UUID NOT NULL,
  exp_key TEXT NOT NULL REFERENCES public.experiments(key) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (profile_id, exp_key)
);

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view experiments" ON public.experiments
  FOR SELECT USING (true);

CREATE POLICY "Users can view own assignments" ON public.experiment_assignments
  FOR SELECT USING (true);

CREATE POLICY "Service can assign experiments" ON public.experiment_assignments
  FOR INSERT WITH CHECK (true);

-- Social proof (testimonials)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  locale TEXT,
  quote TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view testimonials" ON public.testimonials
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL USING (is_admin(auth.uid()));

-- Churn intent tracking
CREATE TABLE IF NOT EXISTS public.churn_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  plan_slug TEXT,
  reason TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'rescued', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.churn_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view churn intents" ON public.churn_intents
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can create churn intents" ON public.churn_intents
  FOR INSERT WITH CHECK (true);

-- Telemetry events
CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id UUID,
  event TEXT NOT NULL,
  props JSONB DEFAULT '{}',
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_event_ts ON public.telemetry_events(event, ts DESC);

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view telemetry" ON public.telemetry_events
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert telemetry" ON public.telemetry_events
  FOR INSERT WITH CHECK (true);

-- Add redeemed column to coupons if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='redeemed') THEN
    ALTER TABLE public.coupons ADD COLUMN redeemed INTEGER DEFAULT 0;
  END IF;
END $$;

-- Function to redeem coupon once
CREATE OR REPLACE FUNCTION public.redeem_coupon_once(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET redeemed = COALESCE(redeemed, 0) + 1
  WHERE code = p_code
    AND (max_redemptions IS NULL OR redeemed < max_redemptions);
END;
$$;

-- Triggers to bump content version when badges or testimonials change
CREATE OR REPLACE FUNCTION public.bump_content_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.zg_versions 
  SET v = v + 1, updated_at = now() 
  WHERE key = 'content';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_badges ON public.badges;
CREATE TRIGGER trg_bump_badges
  AFTER INSERT OR UPDATE OR DELETE ON public.badges
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.bump_content_version();

DROP TRIGGER IF EXISTS trg_bump_testimonials ON public.testimonials;
CREATE TRIGGER trg_bump_testimonials
  AFTER INSERT OR UPDATE OR DELETE ON public.testimonials
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.bump_content_version();