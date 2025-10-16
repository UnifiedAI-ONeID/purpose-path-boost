-- Extend events table with Cal.com fields
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS cal_event_type_slug text,
  ADD COLUMN IF NOT EXISTS cal_booking_url text,
  ADD COLUMN IF NOT EXISTS cal_group boolean DEFAULT false;

-- Link Cal.com bookings back to events
ALTER TABLE cal_bookings
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_slug text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS cal_bookings_event_id_idx ON cal_bookings(event_id);