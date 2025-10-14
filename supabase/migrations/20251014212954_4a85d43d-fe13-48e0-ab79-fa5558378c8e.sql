-- Create leads table for quiz and booking form submissions
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  wechat TEXT,
  clarity_score INTEGER,
  quiz_answers JSONB,
  booking_goal TEXT,
  booking_challenge TEXT,
  booking_timeline TEXT,
  source TEXT DEFAULT 'quiz',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anyone can submit a lead)
CREATE POLICY "Anyone can submit lead" ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admins can view leads (for future admin panel)
CREATE POLICY "Admins can view leads" ON public.leads
  FOR SELECT
  USING (false); -- Will update this when auth is added

-- Add index for email lookups
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);