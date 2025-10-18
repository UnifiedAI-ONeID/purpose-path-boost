-- Pages table for About/Coaching HTML content (if doesn't exist)
CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  html_en TEXT DEFAULT '',
  html_zh TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pages' AND policyname = 'Admins can manage pages') THEN
    ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Admins can manage pages" ON pages FOR ALL USING (is_admin());
    CREATE POLICY "Anyone can view pages" ON pages FOR SELECT USING (true);
  END IF;
END $$;

-- Post analytics for tracking social media metrics (if doesn't exist)
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES social_queue(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  impressions INT,
  clicks INT,
  likes INT,
  comments INT,
  shares INT,
  raw JSONB
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_analytics' AND policyname = 'Admins can view post analytics') THEN
    ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Admins can view post analytics" ON post_analytics FOR SELECT USING (is_admin());
  END IF;
END $$;

-- Add indexes for better performance (if don't exist)
CREATE INDEX IF NOT EXISTS social_queue_status_scheduled_idx ON social_queue(status, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS social_queue_post_idx ON social_queue(post_id);
CREATE INDEX IF NOT EXISTS post_analytics_queue_idx ON post_analytics(queue_id);