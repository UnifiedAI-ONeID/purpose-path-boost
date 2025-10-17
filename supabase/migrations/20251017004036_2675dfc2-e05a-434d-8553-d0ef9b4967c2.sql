-- Add sort column to testimonials table to fix deployment mismatch
ALTER TABLE public.testimonials 
ADD COLUMN IF NOT EXISTS sort integer DEFAULT 100;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_testimonials_sort ON public.testimonials(sort DESC);