-- Extend leads table with pathway and checklist fields
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS pathway text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS family_details text,
  ADD COLUMN IF NOT EXISTS country_of_citizenship text,
  ADD COLUMN IF NOT EXISTS current_location text,
  ADD COLUMN IF NOT EXISTS needs_checklist boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en';

-- Assets table maps pathway/locale to PDF URL
CREATE TABLE IF NOT EXISTS email_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  purpose text NOT NULL,
  pathway text NOT NULL,
  locale text DEFAULT 'en',
  public_url text NOT NULL
);

-- Enable RLS
ALTER TABLE email_assets ENABLE ROW LEVEL SECURITY;

-- Admins can manage assets
CREATE POLICY "Admins can manage email assets"
  ON email_assets FOR ALL
  USING (is_admin());

-- Service can read assets
CREATE POLICY "Service can read email assets"
  ON email_assets FOR SELECT
  USING (true);

-- Email sequences table for automation
CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  step integer NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  template_key text NOT NULL,
  locale text DEFAULT 'en',
  pathway text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- Admins can view sequences
CREATE POLICY "Admins can view email sequences"
  ON email_sequences FOR SELECT
  USING (is_admin());

-- Service can manage sequences
CREATE POLICY "Service can manage email sequences"
  ON email_sequences FOR ALL
  USING (true);

-- OAuth tokens for Google integration
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  account_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can manage OAuth tokens
CREATE POLICY "Admins can manage oauth tokens"
  ON oauth_tokens FOR ALL
  USING (is_admin());

-- Create index for faster sequence queries
CREATE INDEX IF NOT EXISTS idx_email_sequences_scheduled 
  ON email_sequences(scheduled_at) 
  WHERE sent_at IS NULL;