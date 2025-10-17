-- Create blog_templates table if not exists
CREATE TABLE IF NOT EXISTS public.blog_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  name TEXT NOT NULL DEFAULT 'Default',
  body TEXT NOT NULL,
  max_chars INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, locale, name)
);

-- Enable RLS
ALTER TABLE public.blog_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage blog templates" ON public.blog_templates
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active blog templates" ON public.blog_templates
  FOR SELECT USING (active = true);

-- Ensure social_queue has proper columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_queue' AND column_name = 'body') THEN
    ALTER TABLE public.social_queue ADD COLUMN body TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_queue' AND column_name = 'media_url') THEN
    ALTER TABLE public.social_queue ADD COLUMN media_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_queue' AND column_name = 'link_url') THEN
    ALTER TABLE public.social_queue ADD COLUMN link_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_queue' AND column_name = 'published_at') THEN
    ALTER TABLE public.social_queue ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_queue' AND column_name = 'error') THEN
    ALTER TABLE public.social_queue ADD COLUMN error TEXT;
  END IF;
END $$;

-- Insert default templates for common platforms
INSERT INTO public.blog_templates (platform, locale, name, body, max_chars, active)
VALUES
  ('linkedin', 'en', 'Default', '{title}

{excerpt}

Read more: {link}

#coaching #clarity #personalgrowth', 3000, true),
  ('facebook', 'en', 'Default', '{title}

{excerpt}

{link}', 63206, true),
  ('x', 'en', 'Default', '{title}

{excerpt}

{link}

#coaching #clarity', 280, true),
  ('instagram', 'en', 'Default', '{title}

{excerpt}

Link in bio!

#coaching #clarity #personalgrowth', 2200, true),
  ('wechat', 'zh', 'Default', '{title}

{excerpt}

阅读更多：{link}', 10000, true),
  ('xiaohongshu', 'zh', 'Default', '{title}

{excerpt}

#个人成长 #教练', 1000, true)
ON CONFLICT (platform, locale, name) DO NOTHING;