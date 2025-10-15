-- Create profiles table for simpler admin management
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE user_id = auth.uid()), false);
$$;

-- Policy: users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin());

-- Policy: admins can update profiles
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (is_admin());

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, is_admin)
  VALUES (
    NEW.id, 
    -- First user becomes admin automatically
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_admin = true)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Event tracking table
CREATE TABLE IF NOT EXISTS public.events_raw (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  user_hash TEXT,
  event TEXT NOT NULL,
  route TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  device TEXT,
  lang TEXT,
  country TEXT,
  meta JSONB
);

CREATE INDEX idx_events_ts ON public.events_raw (ts);
CREATE INDEX idx_events_session ON public.events_raw (session_id);
CREATE INDEX idx_events_event ON public.events_raw (event);

ALTER TABLE public.events_raw ENABLE ROW LEVEL SECURITY;

-- Daily rollup table for analytics
CREATE TABLE IF NOT EXISTS public.rollup_daily (
  id BIGSERIAL PRIMARY KEY,
  day DATE NOT NULL,
  route TEXT NOT NULL,
  event TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_rollup_unique ON public.rollup_daily (day, route, event);
CREATE INDEX idx_rollup_day ON public.rollup_daily (day);

ALTER TABLE public.rollup_daily ENABLE ROW LEVEL SECURITY;

-- RLS policies for metrics (admin only)
CREATE POLICY "Admins can view events"
ON public.events_raw
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can view rollups"
ON public.rollup_daily
FOR SELECT
USING (is_admin());

-- Rollup functions
CREATE OR REPLACE FUNCTION public.rollup_delete_day(p_day DATE)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rollup_daily WHERE day = p_day;
$$;

CREATE OR REPLACE FUNCTION public.rollup_insert_day(p_day DATE)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO rollup_daily (day, route, event, count)
  SELECT p_day AS day, COALESCE(route, '/'), event, COUNT(*)
  FROM events_raw
  WHERE ts >= p_day::timestamptz
    AND ts < (p_day + 1)::timestamptz
  GROUP BY route, event;
$$;

-- Admin metrics summary function
CREATE OR REPLACE FUNCTION public.admin_metrics_summary(p_from DATE, p_to DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j JSON;
BEGIN
  -- Enforce admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  WITH
  totals AS (
    SELECT event, COUNT(*)::int AS count
    FROM events_raw
    WHERE ts >= p_from::timestamptz AND ts < (p_to + 1)::timestamptz
    GROUP BY event
  ),
  routes AS (
    SELECT route, COUNT(*)::int AS pageviews
    FROM events_raw
    WHERE event = 'page_view' 
      AND ts >= p_from::timestamptz 
      AND ts < (p_to + 1)::timestamptz
    GROUP BY route 
    ORDER BY pageviews DESC 
    LIMIT 10
  ),
  sessions AS (
    SELECT session_id,
      bool_or(event = 'cta_click') AS cta,
      bool_or(event = 'book_start') AS slot,
      bool_or(event = 'book_complete') AS booked
    FROM events_raw
    WHERE ts >= p_from::timestamptz AND ts < (p_to + 1)::timestamptz
    GROUP BY session_id
  ),
  funnel AS (
    SELECT
      SUM(CASE WHEN cta THEN 1 ELSE 0 END)::int AS cta_sessions,
      SUM(CASE WHEN slot THEN 1 ELSE 0 END)::int AS slot_sessions,
      SUM(CASE WHEN booked THEN 1 ELSE 0 END)::int AS booked_sessions
    FROM sessions
  ),
  daily AS (
    SELECT to_char(date_trunc('day', ts), 'YYYY-MM-DD') AS day,
      SUM(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END)::int AS pageviews,
      SUM(CASE WHEN event = 'book_complete' THEN 1 ELSE 0 END)::int AS bookings
    FROM events_raw
    WHERE ts >= p_from::timestamptz AND ts < (p_to + 1)::timestamptz
    GROUP BY 1 
    ORDER BY 1
  )
  SELECT json_build_object(
    'totals', (SELECT json_agg(totals) FROM totals),
    'routes', (SELECT json_agg(routes) FROM routes),
    'funnel', (SELECT row_to_json(funnel) FROM funnel),
    'daily', (SELECT json_agg(daily) FROM daily)
  ) INTO j;

  RETURN j;
END;
$$;

-- Posts table (new JSON-based approach alongside existing blog_posts)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body_json JSONB NOT NULL,
  body_html TEXT NOT NULL,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('draft', 'scheduled', 'published')) NOT NULL DEFAULT 'draft',
  publish_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  canonical_url TEXT,
  social_overrides JSONB,
  channels TEXT[] NOT NULL DEFAULT '{twitter,linkedin,facebook,instagram,youtube_community,medium}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_slug ON public.posts (slug);
CREATE INDEX idx_posts_status ON public.posts (status);
CREATE INDEX idx_posts_publish ON public.posts (publish_at);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Admins can manage posts"
ON public.posts
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can view published posts"
ON public.posts
FOR SELECT
USING (status = 'published' AND publish_at <= now());

-- Trigger for posts updated_at
CREATE OR REPLACE FUNCTION public.update_posts_timestamp()
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

CREATE TRIGGER update_posts_timestamp
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_timestamp();