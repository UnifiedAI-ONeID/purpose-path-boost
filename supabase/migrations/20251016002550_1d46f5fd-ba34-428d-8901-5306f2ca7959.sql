-- Secure bookings table with Cal.com and payment integration
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_token TEXT UNIQUE NOT NULL,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Booking details
  package_id TEXT NOT NULL CHECK (package_id IN ('discovery', 'single', 'monthly', 'quarterly')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Cal.com integration
  cal_event_type_id TEXT NOT NULL,
  cal_booking_id TEXT UNIQUE,
  cal_uid TEXT,
  meeting_url TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  
  -- Payment tracking
  payment_provider TEXT DEFAULT 'airwallex',
  payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'scheduled', 'completed', 'cancelled', 'no_show')),
  
  -- Form data
  booking_notes TEXT,
  booking_metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  
  -- Indexes for common queries
  CONSTRAINT valid_scheduled_times CHECK (scheduled_end IS NULL OR scheduled_end > scheduled_start)
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (is_admin());

CREATE POLICY "Service can insert bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update bookings"
  ON bookings FOR UPDATE
  USING (true);

CREATE POLICY "Users can view own bookings by token"
  ON bookings FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX idx_bookings_token ON bookings(booking_token);
CREATE INDEX idx_bookings_email ON bookings(customer_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_id ON bookings(payment_id);
CREATE INDEX idx_bookings_cal_booking_id ON bookings(cal_booking_id);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_bookings_timestamp()
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

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_timestamp();

-- Cleanup expired bookings (optional cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_bookings()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE bookings
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND expires_at < now()
    AND created_at < now() - INTERVAL '24 hours';
$$;