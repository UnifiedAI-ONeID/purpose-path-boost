-- Create analytics events table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  properties JSONB,
  user_id UUID,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events"
ON public.analytics_events
FOR SELECT
USING (is_admin(auth.uid()));

-- Enable realtime for analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;

-- Set replica identity for realtime
ALTER TABLE public.analytics_events REPLICA IDENTITY FULL;