-- Fix security definer views to use SECURITY INVOKER
-- This ensures views use the permissions of the querying user, not the view creator

ALTER VIEW v_price_test_stats SET (security_invoker = true);
ALTER VIEW v_funnel_weekly SET (security_invoker = true);
ALTER VIEW v_tag_performance SET (security_invoker = true);