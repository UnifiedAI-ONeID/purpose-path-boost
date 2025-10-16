-- Coupons system for coaching offers

-- Coupons (code-based discounts)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  percent_off INTEGER CHECK (percent_off >= 0 AND percent_off <= 100),
  amount_off_cents INTEGER,
  currency TEXT,
  applies_to_slug TEXT,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  max_redemptions INTEGER,
  per_user_limit INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Redemptions (to enforce limits)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL,
  offer_slug TEXT NOT NULL,
  email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupon_redemptions_code_idx ON coupon_redemptions(coupon_code);
CREATE INDEX IF NOT EXISTS coupon_redemptions_email_idx ON coupon_redemptions(email);

-- Promotions (auto-apply via UTM/referrer/date)
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  auto_apply BOOLEAN DEFAULT false,
  applies_to_slug TEXT,
  percent_off INTEGER CHECK (percent_off >= 0 AND percent_off <= 100),
  amount_off_cents INTEGER,
  currency TEXT,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add coupon/promo columns to express_orders
ALTER TABLE express_orders ADD COLUMN IF NOT EXISTS coupon TEXT;
ALTER TABLE express_orders ADD COLUMN IF NOT EXISTS promo TEXT;
ALTER TABLE express_orders ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;

-- RLS policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can view redemptions"
  ON coupon_redemptions FOR SELECT
  USING (is_admin());

CREATE POLICY "Service can insert redemptions"
  ON coupon_redemptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (active = true);