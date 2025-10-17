-- Fix get_top_referrers function to use correct column names
DROP FUNCTION IF EXISTS public.get_top_referrers();

CREATE OR REPLACE FUNCTION public.get_top_referrers()
RETURNS TABLE(profile_id uuid, total int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profile_id, COUNT(*)::int AS total
  FROM zg_referrals
  WHERE ref_code IS NOT NULL
  GROUP BY profile_id
  ORDER BY total DESC
  LIMIT 20;
$$;