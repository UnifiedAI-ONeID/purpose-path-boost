-- Fix function search_path warning for get_coupon_status
-- Add SET search_path = public to ensure secure function execution

CREATE OR REPLACE FUNCTION public.get_coupon_status(coupon_row coupons)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN coupon_row.valid_to IS NOT NULL AND coupon_row.valid_to < NOW() THEN 'expired'
    WHEN coupon_row.valid_from IS NOT NULL AND coupon_row.valid_from > NOW() THEN 'scheduled'
    WHEN coupon_row.active = FALSE THEN 'disabled'
    ELSE 'active'
  END;
$$;