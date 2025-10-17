-- Create contact_submissions table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_submissions') THEN
    CREATE TABLE public.contact_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT DEFAULT 'Contact Form',
      message TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      submitted_at TIMESTAMPTZ DEFAULT now(),
      created_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admins can view contact submissions"
      ON public.contact_submissions
      FOR SELECT
      USING (is_admin());

    CREATE POLICY "Anyone can submit contact form"
      ON public.contact_submissions
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;