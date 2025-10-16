-- Coaching offers table with multilingual support
CREATE TABLE IF NOT EXISTS public.coaching_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_zh_cn text,
  title_zh_tw text,
  summary_en text,
  summary_zh_cn text,
  summary_zh_tw text,
  cal_event_type_slug text NOT NULL,
  active boolean DEFAULT true,
  sort integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coaching pages for long-form content
CREATE TABLE IF NOT EXISTS public.coaching_pages (
  offer_slug text PRIMARY KEY REFERENCES public.coaching_offers(slug) ON DELETE CASCADE,
  hero_image text,
  body_html_en text,
  body_html_zh_cn text,
  body_html_zh_tw text,
  faqs jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coaching_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_pages ENABLE ROW LEVEL SECURITY;

-- Policies for coaching_offers
CREATE POLICY "Anyone can view active coaching offers"
ON public.coaching_offers FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage coaching offers"
ON public.coaching_offers FOR ALL
USING (is_admin());

-- Policies for coaching_pages
CREATE POLICY "Anyone can view coaching pages for active offers"
ON public.coaching_pages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coaching_offers
    WHERE coaching_offers.slug = coaching_pages.offer_slug
    AND coaching_offers.active = true
  )
);

CREATE POLICY "Admins can manage coaching pages"
ON public.coaching_pages FOR ALL
USING (is_admin());

-- Create indexes
CREATE INDEX IF NOT EXISTS coaching_offers_active_idx ON public.coaching_offers(active);
CREATE INDEX IF NOT EXISTS coaching_offers_sort_idx ON public.coaching_offers(sort);