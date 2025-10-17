-- Create plans table for subscription tiers
CREATE TABLE IF NOT EXISTS public.plans (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price_cents INTEGER NOT NULL DEFAULT 0,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage plans"
ON public.plans FOR ALL
USING (is_admin());

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.zg_profiles(id) ON DELETE CASCADE,
  plan_slug TEXT NOT NULL REFERENCES public.plans(slug),
  status TEXT NOT NULL DEFAULT 'active',
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  renews BOOLEAN DEFAULT true,
  airwallex_agreement_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() IN (SELECT auth_user_id FROM public.zg_profiles WHERE id = profile_id));

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (is_admin());

CREATE POLICY "Service can manage subscriptions"
ON public.subscriptions FOR ALL
USING (true);

-- Create lesson_usage table for paywall tracking
CREATE TABLE IF NOT EXISTS public.lesson_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.zg_profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  watch_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, period_start)
);

ALTER TABLE public.lesson_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
ON public.lesson_usage FOR SELECT
USING (auth.uid() IN (SELECT auth_user_id FROM public.zg_profiles WHERE id = profile_id));

CREATE POLICY "Service can manage usage"
ON public.lesson_usage FOR ALL
USING (true);

-- Create referral_settings table
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_percent_off INTEGER DEFAULT 20,
  referrer_percent_off INTEGER DEFAULT 20,
  coupon_expiry_days INTEGER DEFAULT 7,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view referral settings"
ON public.referral_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage referral settings"
ON public.referral_settings FOR ALL
USING (is_admin());

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  referrer_profile_id UUID NOT NULL REFERENCES public.zg_profiles(id) ON DELETE CASCADE,
  friend_coupon_code TEXT NOT NULL,
  referrer_reward_coupon TEXT,
  status TEXT DEFAULT 'issued',
  converted_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() IN (SELECT auth_user_id FROM public.zg_profiles WHERE id = referrer_profile_id));

CREATE POLICY "Anyone can view referrals by code"
ON public.referrals FOR SELECT
USING (true);

CREATE POLICY "Service can manage referrals"
ON public.referrals FOR ALL
USING (true);

-- Create view for profile plan with features
CREATE OR REPLACE VIEW public.v_profile_plan AS
SELECT 
  zg_profiles.id as profile_id,
  COALESCE(subscriptions.plan_slug, 'free') as plan_slug,
  subscriptions.period_start,
  subscriptions.period_end,
  subscriptions.status,
  COALESCE(plans.features, '{"videos_per_month": 3, "all_access": false}'::jsonb) as features
FROM public.zg_profiles
LEFT JOIN public.subscriptions ON zg_profiles.id = subscriptions.profile_id
LEFT JOIN public.plans ON subscriptions.plan_slug = plans.slug;

-- Create function to increment lesson usage
CREATE OR REPLACE FUNCTION public.increment_lesson_usage(p_profile UUID, p_start TIMESTAMP WITH TIME ZONE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lesson_usage (profile_id, period_start, watch_count)
  VALUES (p_profile, p_start, 1)
  ON CONFLICT (profile_id, period_start)
  DO UPDATE SET watch_count = lesson_usage.watch_count + 1;
END;
$$;

-- Insert default referral settings
INSERT INTO public.referral_settings (friend_percent_off, referrer_percent_off, coupon_expiry_days)
VALUES (20, 20, 7)
ON CONFLICT DO NOTHING;

-- Insert default plans
INSERT INTO public.plans (slug, name, description, base_price_cents, features) VALUES
('free', 'Free Plan', 'Limited access to lessons', 0, '{"videos_per_month": 3, "all_access": false}'::jsonb),
('starter', 'Starter Plan', 'More lessons per month', 990, '{"videos_per_month": 10, "all_access": false}'::jsonb),
('growth', 'Growth Plan', 'Unlimited lessons', 1990, '{"videos_per_month": 999999, "all_access": true}'::jsonb),
('pro', 'Pro Plan', 'All access plus extras', 4990, '{"videos_per_month": 999999, "all_access": true, "priority_support": true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;