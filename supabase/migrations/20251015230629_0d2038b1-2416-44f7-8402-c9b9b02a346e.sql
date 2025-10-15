-- A/B Testing Tables for Dynamic Pricing

-- Track A/B test variants
CREATE TABLE IF NOT EXISTS event_price_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES event_tickets(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  variant TEXT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Assignments per visitor
CREATE TABLE IF NOT EXISTS event_price_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES event_price_tests(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  country TEXT,
  variant TEXT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stats view per variant per region
CREATE OR REPLACE VIEW v_price_test_stats AS
SELECT
  t.event_id, 
  t.ticket_id, 
  t.region, 
  t.variant,
  t.currency,
  COUNT(DISTINCT a.visitor_id) AS visitors,
  SUM(CASE WHEN r.status='paid' THEN 1 ELSE 0 END) AS purchases,
  COALESCE(SUM(CASE WHEN r.status='paid' THEN r.amount_cents ELSE 0 END), 0) AS revenue_cents,
  ROUND((SUM(CASE WHEN r.status='paid' THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(DISTINCT a.visitor_id), 0)) * 100, 2) AS conv_rate_pct
FROM event_price_tests t
LEFT JOIN event_price_assignments a ON a.test_id = t.id
LEFT JOIN event_regs r ON r.email = a.visitor_id AND r.event_id = t.event_id
GROUP BY 1, 2, 3, 4, 5;

-- Enable RLS
ALTER TABLE event_price_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_price_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for admins
CREATE POLICY "Admins can manage price tests"
  ON event_price_tests FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can view price assignments"
  ON event_price_assignments FOR SELECT
  USING (is_admin());

-- Allow public to be assigned variants
CREATE POLICY "Anyone can be assigned price variant"
  ON event_price_assignments FOR INSERT
  WITH CHECK (true);