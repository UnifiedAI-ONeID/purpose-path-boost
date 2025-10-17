-- Add new columns to coupons table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'name') THEN
    ALTER TABLE public.coupons ADD COLUMN name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'notes') THEN
    ALTER TABLE public.coupons ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS coupons_active_idx ON public.coupons(active, valid_to DESC) WHERE active = TRUE;

-- Helper function to get coupon status
CREATE OR REPLACE FUNCTION public.get_coupon_status(coupon_row public.coupons)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE
    WHEN coupon_row.valid_to IS NOT NULL AND coupon_row.valid_to < NOW() THEN 'expired'
    WHEN coupon_row.valid_from IS NOT NULL AND coupon_row.valid_from > NOW() THEN 'scheduled'
    WHEN coupon_row.active = FALSE THEN 'disabled'
    ELSE 'active'
  END;
$$;