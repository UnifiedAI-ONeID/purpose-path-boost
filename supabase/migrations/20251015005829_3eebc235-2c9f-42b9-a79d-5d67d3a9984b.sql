-- Fix function search path for security
DROP TRIGGER IF EXISTS update_social_configs_timestamp ON public.social_configs;
DROP FUNCTION IF EXISTS update_social_config_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION update_social_config_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_social_configs_timestamp
BEFORE UPDATE ON public.social_configs
FOR EACH ROW
EXECUTE FUNCTION update_social_config_timestamp();