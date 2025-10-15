-- Multi-currency pricing system

-- 1) Add base currency columns to tickets (keeping old ones for backward compatibility)
ALTER TABLE event_tickets
  ADD COLUMN IF NOT EXISTS base_currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS base_price_cents INT NOT NULL DEFAULT 0;

-- Migrate existing data
UPDATE event_tickets 
SET base_currency = currency, 
    base_price_cents = price_cents
WHERE base_price_cents = 0;

-- 2) Per-currency hard overrides (wins over FX)
CREATE TABLE IF NOT EXISTS event_ticket_fx_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES event_tickets(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  price_cents INT NOT NULL,
  UNIQUE(ticket_id, currency)
);

-- 3) Cached daily FX rates
CREATE TABLE IF NOT EXISTS fx_rates (
  base TEXT PRIMARY KEY,
  rates JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Pricing settings (singleton)
CREATE TABLE IF NOT EXISTS pricing_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  buffer_bps INT NOT NULL DEFAULT 150,
  supported TEXT[] NOT NULL DEFAULT '{USD,CAD,EUR,GBP,HKD,SGD,CNY}',
  cny_rounding TEXT NOT NULL DEFAULT 'yuan',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = true)
);

INSERT INTO pricing_settings (id) VALUES (true)
  ON CONFLICT (id) DO NOTHING;

-- RLS policies
ALTER TABLE event_ticket_fx_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view FX overrides"
  ON event_ticket_fx_overrides FOR SELECT USING (true);

CREATE POLICY "Admins can manage FX overrides"
  ON event_ticket_fx_overrides FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view FX rates"
  ON fx_rates FOR SELECT USING (true);

CREATE POLICY "Service role can manage FX rates"
  ON fx_rates FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view pricing settings"
  ON pricing_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update pricing settings"
  ON pricing_settings FOR UPDATE USING (is_admin());