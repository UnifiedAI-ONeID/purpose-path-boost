-- Fix function search_path security warnings for trigger functions
-- Add SECURITY DEFINER and SET search_path to all trigger functions that are missing it

-- Fix update_me_goals_updated_at function
CREATE OR REPLACE FUNCTION public.update_me_goals_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix update_posts_timestamp function
CREATE OR REPLACE FUNCTION public.update_posts_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_bookings_timestamp function
CREATE OR REPLACE FUNCTION public.update_bookings_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;