-- Create enum for social media platforms
CREATE TYPE public.social_platform AS ENUM (
  'twitter',
  'linkedin',
  'facebook',
  'instagram',
  'youtube_community',
  'medium'
);

-- Create social_configs table for encrypted credentials
CREATE TABLE public.social_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform public.social_platform NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Encrypted secrets (Base64 encoded)
  app_key_enc TEXT,
  app_secret_enc TEXT,
  access_token_enc TEXT,
  refresh_token_enc TEXT,
  account_id_enc TEXT,
  webhook_url_enc TEXT,
  
  -- Non-sensitive configuration
  posting_template TEXT,
  
  -- Testing and audit
  last_test_status TEXT CHECK (last_test_status IN ('ok', 'fail', 'pending')),
  last_test_at TIMESTAMP WITH TIME ZONE,
  
  -- Versioning for audit trail
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_configs ENABLE ROW LEVEL SECURITY;

-- Only admins can view configs
CREATE POLICY "Admins can view social configs"
ON public.social_configs
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can update configs
CREATE POLICY "Admins can update social configs"
ON public.social_configs
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can insert configs
CREATE POLICY "Admins can insert social configs"
ON public.social_configs
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can delete configs
CREATE POLICY "Admins can delete social configs"
ON public.social_configs
FOR DELETE
USING (is_admin(auth.uid()));

-- Create audit log table
CREATE TABLE public.social_config_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform public.social_platform NOT NULL,
  action TEXT NOT NULL,
  version INTEGER NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.social_config_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.social_config_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_social_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_configs_timestamp
BEFORE UPDATE ON public.social_configs
FOR EACH ROW
EXECUTE FUNCTION update_social_config_timestamp();

-- Insert default platform configs
INSERT INTO public.social_configs (platform, enabled) VALUES
  ('twitter', false),
  ('linkedin', false),
  ('facebook', false),
  ('instagram', false),
  ('youtube_community', false),
  ('medium', false)
ON CONFLICT (platform) DO NOTHING;