-- Create social_queue table for cross-posting
CREATE TABLE IF NOT EXISTS public.social_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  platform TEXT NOT NULL,
  locale TEXT DEFAULT 'en',
  title TEXT,
  body TEXT,
  media_url TEXT,
  link_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  error TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS social_queue_status_scheduled ON public.social_queue(status, scheduled_at);

ALTER TABLE public.social_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage social queue" ON public.social_queue
  FOR ALL USING (is_admin());

-- Create post_analytics table
CREATE TABLE IF NOT EXISTS public.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES public.social_queue(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  impressions INTEGER,
  clicks INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  raw JSONB
);

ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage post analytics" ON public.post_analytics
  FOR ALL USING (is_admin());

-- Create function to get top referrers (using correct column name)
CREATE OR REPLACE FUNCTION public.get_top_referrers()
RETURNS TABLE(referrer_profile_id UUID, total INTEGER)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profile_id AS referrer_profile_id, COUNT(*)::INTEGER AS total
  FROM zg_referrals
  WHERE ref_code IS NOT NULL
  GROUP BY profile_id
  ORDER BY total DESC
  LIMIT 20;
$$;