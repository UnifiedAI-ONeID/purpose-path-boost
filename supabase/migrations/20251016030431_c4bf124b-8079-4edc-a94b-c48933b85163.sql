-- Add billing and pricing fields to coaching offers
ALTER TABLE public.coaching_offers
  ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'free' CHECK (billing_type IN ('free', 'paid')),
  ADD COLUMN IF NOT EXISTS base_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS base_price_cents integer DEFAULT 0;

-- Create coaching price overrides table
CREATE TABLE IF NOT EXISTS public.coaching_price_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_slug text REFERENCES public.coaching_offers(slug) ON DELETE CASCADE,
  currency text NOT NULL,
  price_cents integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(offer_slug, currency)
);

-- Enable RLS
ALTER TABLE public.coaching_price_overrides ENABLE ROW LEVEL SECURITY;

-- Policies for coaching_price_overrides
CREATE POLICY "Anyone can view coaching price overrides"
ON public.coaching_price_overrides FOR SELECT
USING (true);

CREATE POLICY "Admins can manage coaching price overrides"
ON public.coaching_price_overrides FOR ALL
USING (is_admin());

-- Create index
CREATE INDEX IF NOT EXISTS coaching_price_overrides_offer_idx ON public.coaching_price_overrides(offer_slug);