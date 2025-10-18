-- Fix Security Definer Views by using SECURITY INVOKER
-- This ensures views use the permissions of the querying user, not the view creator

-- Drop and recreate v_funnel_weekly with SECURITY INVOKER
DROP VIEW IF EXISTS v_funnel_weekly CASCADE;
CREATE VIEW v_funnel_weekly 
WITH (security_invoker = true)
AS
WITH weeks AS (
  SELECT
    date_trunc('week', created_at) AS week_start,
    COUNT(*)::int AS leads,
    COUNT(*) FILTER (WHERE source = 'book')::int AS booked,
    COUNT(*) FILTER (WHERE stage = 'won')::int AS won
  FROM leads
  GROUP BY 1
)
SELECT
  week_start::date,
  leads,
  booked,
  won,
  CASE WHEN leads > 0 THEN ROUND(booked::numeric / leads * 100, 1) ELSE 0 END AS cvr_booked_pct,
  CASE WHEN booked > 0 THEN ROUND(won::numeric / booked * 100, 1) ELSE 0 END AS cvr_won_pct,
  CASE WHEN leads > 0 THEN ROUND(won::numeric / leads * 100, 1) ELSE 0 END AS cvr_lead_to_client_pct
FROM weeks
ORDER BY week_start;

-- Drop and recreate v_price_test_stats with SECURITY INVOKER
DROP VIEW IF EXISTS v_price_test_stats CASCADE;
CREATE VIEW v_price_test_stats
WITH (security_invoker = true)
AS
SELECT
  t.event_id,
  t.ticket_id,
  t.region,
  t.variant,
  t.currency,
  COUNT(DISTINCT a.visitor_id) AS visitors,
  SUM(CASE WHEN r.status = 'paid' THEN 1 ELSE 0 END) AS purchases,
  COALESCE(SUM(CASE WHEN r.status = 'paid' THEN r.amount_cents ELSE 0 END), 0) AS revenue_cents,
  ROUND((SUM(CASE WHEN r.status = 'paid' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(DISTINCT a.visitor_id), 0)) * 100, 2) AS conv_rate_pct
FROM event_price_tests t
LEFT JOIN event_price_assignments a ON a.test_id = t.id
LEFT JOIN event_regs r ON r.email = a.visitor_id AND r.event_id = t.event_id
GROUP BY t.event_id, t.ticket_id, t.region, t.variant, t.currency;

-- Drop and recreate v_tag_performance with SECURITY INVOKER
DROP VIEW IF EXISTS v_tag_performance CASCADE;
CREATE VIEW v_tag_performance
WITH (security_invoker = true)
AS
SELECT
  sp.primary_tag AS tag,
  date_trunc('week', sm.captured_at)::date AS week_start,
  COUNT(DISTINCT sp.id) AS post_count,
  SUM(COALESCE(sm.impressions, 0)) AS impressions,
  SUM(COALESCE(sm.likes, 0) + COALESCE(sm.comments, 0) + COALESCE(sm.shares, 0) + COALESCE(sm.saves, 0)) AS engagements,
  SUM(COALESCE(sm.clicks, 0)) AS clicks,
  SUM(COALESCE(sm.video_views, 0)) AS video_views,
  CASE 
    WHEN SUM(COALESCE(sm.impressions, 0)) > 0 
    THEN ROUND((SUM(COALESCE(sm.likes, 0) + COALESCE(sm.comments, 0) + COALESCE(sm.shares, 0) + COALESCE(sm.saves, 0))::numeric / SUM(COALESCE(sm.impressions, 0))) * 100, 2)
    ELSE 0
  END AS er_pct,
  CASE 
    WHEN SUM(COALESCE(sm.impressions, 0)) > 0 AND SUM(COALESCE(sm.clicks, 0)) > 0
    THEN ROUND((SUM(COALESCE(sm.clicks, 0))::numeric / SUM(COALESCE(sm.impressions, 0))) * 100, 2)
    ELSE NULL
  END AS ctr_pct
FROM social_metrics sm
JOIN social_posts sp ON sp.platform_post_id = sm.platform_post_id
WHERE sp.primary_tag IS NOT NULL AND sp.status = 'posted'
GROUP BY sp.primary_tag, date_trunc('week', sm.captured_at)::date
ORDER BY week_start DESC, tag;

-- Fix trigger functions to include SECURITY DEFINER and SET search_path

-- Fix update_blog_updated_at
CREATE OR REPLACE FUNCTION public.update_blog_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_cal_bookings_timestamp
CREATE OR REPLACE FUNCTION public.update_cal_bookings_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_social_config_timestamp
CREATE OR REPLACE FUNCTION public.update_social_config_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;