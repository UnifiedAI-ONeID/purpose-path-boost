-- SEO Monitoring System Tables

-- What the system should watch (you can disable any source in Admin)
CREATE TABLE IF NOT EXISTS public.seo_watch_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  extra JSONB DEFAULT '{}'
);

-- Alerts to show in /admin
CREATE TABLE IF NOT EXISTS public.seo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('info','warn','critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source_key TEXT NOT NULL,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS seo_alerts_open_idx ON public.seo_alerts (resolved_at) 
WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS seo_alerts_created_idx ON public.seo_alerts (created_at DESC);

-- Local SEO checks (your site) snapshots for diffing
CREATE TABLE IF NOT EXISTS public.seo_site_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_site_snapshots_created_idx ON public.seo_site_snapshots (created_at DESC);

-- Admin preferences (notify channels)
CREATE TABLE IF NOT EXISTS public.seo_notify_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  slack_webhook TEXT,
  locale TEXT DEFAULT 'en'
);

-- Enable RLS
ALTER TABLE public.seo_watch_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_site_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_notify_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins only
CREATE POLICY "Admins can manage SEO watch sources" ON public.seo_watch_sources
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage SEO alerts" ON public.seo_alerts
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can view SEO snapshots" ON public.seo_site_snapshots
  FOR SELECT USING (is_admin());

CREATE POLICY "Service can insert SEO snapshots" ON public.seo_site_snapshots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage notify settings" ON public.seo_notify_settings
  FOR ALL USING (is_admin());

-- Insert default watch sources
INSERT INTO public.seo_watch_sources (key, label, extra) VALUES
  ('google_search_central', 'Google Search Central', '{"feed":"https://developers.google.com/search/blog/feeds/posts/default"}'),
  ('schema_dot_org', 'Schema.org Changelog', '{"feed":"https://schema.org/docs/releases.html"}'),
  ('core_web_vitals', 'Core Web Vitals', '{"lcp_ms":2500,"inp_ms":200,"cls":0.1}')
ON CONFLICT (key) DO NOTHING;