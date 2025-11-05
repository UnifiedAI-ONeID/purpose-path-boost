-- Create email attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', false);

-- Storage policies for email attachments
CREATE POLICY "Admins can upload email attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-attachments' AND
  is_admin()
);

CREATE POLICY "Admins can view email attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'email-attachments' AND
  is_admin()
);

CREATE POLICY "Admins can delete email attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-attachments' AND
  is_admin()
);

-- Funnel stages table
CREATE TABLE public.funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  auto_progress BOOLEAN DEFAULT false,
  delay_hours INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name)
);

-- User funnel progress tracking
CREATE TABLE public.user_funnel_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES zg_profiles(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES funnel_stages(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(profile_id, stage_id)
);

-- Email templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  stage_id UUID REFERENCES funnel_stages(id) ON DELETE SET NULL,
  from_name TEXT DEFAULT 'ZhenGrowth',
  from_email TEXT DEFAULT 'hello@zhengrowth.com',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name)
);

-- Email attachments metadata
CREATE TABLE public.email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email queue for scheduled sends
CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES zg_profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email send log
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES zg_profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_funnel_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage funnel stages"
ON public.funnel_stages FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Anyone can view active funnel stages"
ON public.funnel_stages FOR SELECT
TO authenticated
USING (active = true);

CREATE POLICY "Admins can view all user progress"
ON public.user_funnel_progress FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view own progress"
ON public.user_funnel_progress FOR SELECT
TO authenticated
USING (profile_id = get_my_profile_id());

CREATE POLICY "Service can manage user progress"
ON public.user_funnel_progress FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can manage email attachments"
ON public.email_attachments FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view email queue"
ON public.email_queue FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Service can manage email queue"
ON public.email_queue FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Admins can view email logs"
ON public.email_logs FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Service can insert email logs"
ON public.email_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger to auto-enroll new users in welcome funnel
CREATE OR REPLACE FUNCTION public.auto_enroll_welcome_funnel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  welcome_stage_id UUID;
BEGIN
  -- Get the welcome stage
  SELECT id INTO welcome_stage_id
  FROM public.funnel_stages
  WHERE name = 'Welcome' AND active = true
  LIMIT 1;
  
  IF welcome_stage_id IS NOT NULL THEN
    -- Enroll user in welcome stage
    INSERT INTO public.user_funnel_progress (profile_id, stage_id, entered_at)
    VALUES (NEW.id, welcome_stage_id, now())
    ON CONFLICT (profile_id, stage_id) DO NOTHING;
    
    -- Queue welcome email
    INSERT INTO public.email_queue (profile_id, template_id, scheduled_for)
    SELECT NEW.id, et.id, now()
    FROM public.email_templates et
    WHERE et.stage_id = welcome_stage_id AND et.active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_enroll_funnel
  AFTER INSERT ON public.zg_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_welcome_funnel();

-- Insert default funnel stages
INSERT INTO public.funnel_stages (name, description, order_index, auto_progress, delay_hours, active)
VALUES
  ('Welcome', 'Initial welcome stage for new users', 1, true, 0, true),
  ('Onboarding', 'User onboarding and introduction', 2, true, 24, true),
  ('Engagement', 'Active engagement and value delivery', 3, true, 72, true),
  ('Offer', 'Present coaching offers and CTAs', 4, false, 168, true),
  ('Nurture', 'Long-term nurture and retention', 5, false, 336, true);

-- Insert default welcome email template
INSERT INTO public.email_templates (name, subject, html_body, stage_id, from_name, from_email)
SELECT
  'Welcome Email',
  'Welcome to ZhenGrowth - Your Journey Begins',
  '<h1>Welcome to ZhenGrowth!</h1>
  <p>Hi {{name}},</p>
  <p>Thank you for joining ZhenGrowth. We''re excited to support you on your growth journey.</p>
  <p>Here''s what you can expect:</p>
  <ul>
    <li>Personalized coaching insights</li>
    <li>Expert guidance in English and Chinese</li>
    <li>Tools to achieve clarity and confidence</li>
  </ul>
  <p>Ready to get started? <a href="https://zhengrowth.com/quiz">Take our 60-second assessment</a></p>
  <p>Best regards,<br>The ZhenGrowth Team</p>',
  fs.id,
  'ZhenGrowth',
  'hello@zhengrowth.com'
FROM public.funnel_stages fs
WHERE fs.name = 'Welcome'
LIMIT 1;