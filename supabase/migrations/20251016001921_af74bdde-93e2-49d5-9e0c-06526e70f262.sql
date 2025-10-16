-- Fix search_path by recreating the trigger and function
DROP TRIGGER IF EXISTS update_cal_bookings_updated_at ON cal_bookings;
DROP FUNCTION IF EXISTS update_cal_bookings_timestamp();

CREATE OR REPLACE FUNCTION update_cal_bookings_timestamp()
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

CREATE TRIGGER update_cal_bookings_updated_at
  BEFORE UPDATE ON cal_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_cal_bookings_timestamp();