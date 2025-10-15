-- Add new columns to leads table for CRM functionality
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'qualified', 'won', 'lost')),
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS quiz_score integer;

-- Add index for better performance on stage filtering
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);

-- Add index for created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Enable realtime for leads table
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;