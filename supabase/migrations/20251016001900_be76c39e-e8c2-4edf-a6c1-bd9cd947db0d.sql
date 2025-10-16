-- Cal.com bookings table to store booking events
CREATE TABLE cal_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cal_booking_id TEXT UNIQUE NOT NULL,
  cal_uid TEXT NOT NULL,
  event_type_id TEXT NOT NULL,
  event_type_slug TEXT,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_timezone TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, cancelled, rescheduled, completed
  meeting_url TEXT,
  location TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cal.com event types table
CREATE TABLE cal_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cal_event_type_id TEXT UNIQUE NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  length INTEGER NOT NULL, -- duration in minutes
  price INTEGER DEFAULT 0, -- price in cents
  currency TEXT DEFAULT 'USD',
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE cal_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cal_event_types ENABLE ROW LEVEL SECURITY;

-- Policies for cal_bookings
CREATE POLICY "Admins can view all bookings"
  ON cal_bookings FOR SELECT
  USING (is_admin());

CREATE POLICY "Anyone can insert bookings via webhook"
  ON cal_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Webhook can update bookings"
  ON cal_bookings FOR UPDATE
  USING (true);

-- Policies for cal_event_types
CREATE POLICY "Admins can manage event types"
  ON cal_event_types FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view active event types"
  ON cal_event_types FOR SELECT
  USING (active = true);

-- Indexes for performance
CREATE INDEX idx_cal_bookings_cal_id ON cal_bookings(cal_booking_id);
CREATE INDEX idx_cal_bookings_email ON cal_bookings(attendee_email);
CREATE INDEX idx_cal_bookings_start_time ON cal_bookings(start_time);
CREATE INDEX idx_cal_bookings_status ON cal_bookings(status);
CREATE INDEX idx_cal_event_types_slug ON cal_event_types(slug);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_cal_bookings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cal_bookings_updated_at
  BEFORE UPDATE ON cal_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_cal_bookings_timestamp();