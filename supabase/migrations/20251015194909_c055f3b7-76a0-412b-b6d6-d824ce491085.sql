-- Create secrets table for encrypted storage
CREATE TABLE IF NOT EXISTS secrets (
  key text PRIMARY KEY,
  value bytea NOT NULL,         -- ciphertext
  iv bytea NOT NULL,            -- AES-GCM IV
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Read-only index for diagnostics
CREATE INDEX IF NOT EXISTS secrets_updated_idx ON secrets (updated_at DESC);

-- RLS: deny all direct access; only service role via edge function
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_direct_access" ON secrets
FOR ALL
USING (false);