-- Dashboard SQL functions for admin metrics

-- DAU calculation
CREATE OR REPLACE FUNCTION public.calc_dau()
RETURNS TABLE(n bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT session_id)::bigint
  FROM events_raw
  WHERE ts >= NOW() - INTERVAL '1 day';
$$;

-- MAU calculation
CREATE OR REPLACE FUNCTION public.calc_mau()
RETURNS TABLE(n bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT session_id)::bigint
  FROM events_raw
  WHERE ts >= NOW() - INTERVAL '30 days';
$$;

-- Content leaderboard for last 30 days
CREATE OR REPLACE FUNCTION public.content_leaderboard_30d()
RETURNS TABLE(slug text, title text, starts bigint, completes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    le.lesson_slug as slug,
    l.title_en as title,
    SUM(CASE WHEN le.ev = 'start' THEN 1 ELSE 0 END)::bigint as starts,
    SUM(CASE WHEN le.ev = 'complete' THEN 1 ELSE 0 END)::bigint as completes
  FROM lesson_events le
  LEFT JOIN lessons l ON l.slug = le.lesson_slug
  WHERE le.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY le.lesson_slug, l.title_en
  ORDER BY completes DESC NULLS LAST
  LIMIT 10;
$$;

-- Funnel calculation for last 30 days
CREATE OR REPLACE FUNCTION public.calc_funnel_30d()
RETURNS TABLE(stage text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'visitors'::text as stage, COUNT(DISTINCT session_id)::bigint as count
  FROM events_raw
  WHERE ts >= NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT 'leads'::text, COUNT(*)::bigint
  FROM leads
  WHERE created_at >= NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT 'bookings'::text, COUNT(*)::bigint
  FROM bookings
  WHERE created_at >= NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT 'paid'::text, COUNT(*)::bigint
  FROM bookings
  WHERE created_at >= NOW() - INTERVAL '30 days'
    AND payment_status = 'paid';
$$;

-- MRR calculation (using active coaching offers)
CREATE OR REPLACE FUNCTION public.calc_mrr()
RETURNS TABLE(amount_cents bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(base_price_cents), 0)::bigint as amount_cents
  FROM coaching_offers
  WHERE billing_type = 'subscription' AND active = true;
$$;

-- RLS policy for me_sessions
ALTER TABLE public.me_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.me_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.me_sessions
  FOR SELECT
  USING (profile_id = get_my_profile_id());

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.me_sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.me_sessions
  FOR INSERT
  WITH CHECK (profile_id = get_my_profile_id());

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.me_sessions;
CREATE POLICY "Admins can view all sessions"
  ON public.me_sessions
  FOR SELECT
  USING (is_admin());