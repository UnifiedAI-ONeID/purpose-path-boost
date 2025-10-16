-- AI suggestions cache table
CREATE TABLE IF NOT EXISTS ai_suggestions_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  suggestion_lang text NOT NULL CHECK (suggestion_lang IN ('en', 'zh-CN', 'zh-TW')),
  suggestion_md text NOT NULL,
  action_url text,
  score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_suggestions_cache_prof_idx ON ai_suggestions_cache(profile_id, suggestion_lang);

-- Enable RLS
ALTER TABLE ai_suggestions_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own suggestions"
  ON ai_suggestions_cache FOR SELECT
  USING (true);

CREATE POLICY "Service can insert suggestions"
  ON ai_suggestions_cache FOR INSERT
  WITH CHECK (true);

-- Remote flags for feature toggles
CREATE TABLE IF NOT EXISTS remote_flags (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE remote_flags ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view flags"
  ON remote_flags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage flags"
  ON remote_flags FOR ALL
  USING (is_admin());

-- Initialize AI suggest flag
INSERT INTO remote_flags(key, value) VALUES
('ai_suggest', '{"enabled": true, "ttl_minutes": 240}')
ON CONFLICT (key) DO UPDATE SET value = excluded.value;