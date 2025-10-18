-- Fix v_profile_plan view to use SECURITY INVOKER
DROP VIEW IF EXISTS public.v_profile_plan CASCADE;

CREATE VIEW public.v_profile_plan
WITH (security_invoker = true)
AS
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