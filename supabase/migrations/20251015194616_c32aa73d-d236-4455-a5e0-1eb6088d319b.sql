-- Fix security definer view by enabling security invoker mode
ALTER VIEW v_funnel_weekly SET (security_invoker = on);