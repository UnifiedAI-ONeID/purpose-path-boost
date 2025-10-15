-- Create weekly funnel view with conversion rates
CREATE OR REPLACE VIEW v_funnel_weekly AS
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