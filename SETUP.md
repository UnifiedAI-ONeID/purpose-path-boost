# ZhenGrowth Setup Guide

Complete setup instructions for the ZhenGrowth coaching platform.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:8080`

## 📋 Environment Variables

Create a `.env` file in the root directory (use `.env.example` as template):

### Required for Production

```env
VITE_SITE_URL=https://zhengrowth.com
```

### Analytics (Optional but Recommended)

#### Umami Analytics (Free)
1. Sign up at https://cloud.umami.is/
2. Create a website
3. Get your website ID from Settings
4. Add to `.env`:
```env
VITE_UMAMI_WEBSITE_ID=your-website-id
```
5. Already configured in `index.html` - just replace `VITE_UMAMI_WEBSITE_ID` with your actual ID

#### PostHog Analytics (Optional - Free Tier)
1. Sign up at https://posthog.com/
2. Create a project
3. Get your project API key
4. Add to `.env`:
```env
VITE_POSTHOG_KEY=phc_your_actual_key
```

### Translation API (Optional)

The app uses LibreTranslate for automatic translation. Default is the free public API:

```env
VITE_TRANSLATE_API=https://libretranslate.com
```

For better performance, consider:
- Self-hosting LibreTranslate
- Using a paid translation API
- Pre-translating all content

### Payment Integration (Airwallex)

When ready to accept payments:

1. Sign up for Airwallex at https://www.airwallex.com/
2. Get your API credentials
3. Add to `.env`:
```env
AIRWALLEX_API_KEY=your-api-key
AIRWALLEX_CLIENT_ID=your-client-id
```

### Backend (Supabase via Lovable Cloud)

For lead capture and email sending, enable Lovable Cloud:

1. In Lovable editor, click "Connect Lovable Cloud"
2. This automatically sets up Supabase
3. Environment variables will be auto-configured:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## 🗄️ Database Setup (via Lovable Cloud)

Once Lovable Cloud is enabled:

### 1. Create Leads Table

```sql
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  wechat TEXT,
  clarity_score INTEGER,
  quiz_answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting (public can submit)
CREATE POLICY "Anyone can submit lead" ON leads
  FOR INSERT
  WITH CHECK (true);
```

### 2. Email Sending Setup

Install Resend for email:

1. Sign up at https://resend.com
2. Verify your domain (required for production)
3. Create API key
4. Add secret in Lovable Cloud secrets: `RESEND_API_KEY`

### 3. Edge Function for Lead Capture

Create `supabase/functions/capture-lead/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, language, wechat, clarityScore, answers } = await req.json();

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Save lead
    const { error: dbError } = await supabase.from('leads').insert({
      name,
      email,
      language,
      wechat,
      clarity_score: clarityScore,
      quiz_answers: answers,
    });

    if (dbError) throw dbError;

    // Send email
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    await resend.emails.send({
      from: 'ZhenGrowth <hello@zhengrowth.com>',
      to: [email],
      subject: 'Your 7-Day Clarity Sprint Guide',
      html: `
        <h1>Thank you, ${name}!</h1>
        <p>Your clarity score: <strong>${clarityScore}%</strong></p>
        <p>Download your free guide: [PDF link here]</p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

Update `supabase/config.toml`:
```toml
[functions.capture-lead]
verify_jwt = false
```

## 📱 Features Configuration

### Multi-Language Support

The app supports:
- English (en)
- Traditional Chinese (zh-TW)
- Simplified Chinese (zh-CN)

Translation files are in `src/i18n/en/*.json`. 

Auto-translation happens on-the-fly for missing keys using LibreTranslate API.

### Lead Magnet Quiz

The clarity assessment quiz:
- 10 questions with 5-point scale
- Calculates clarity score (0-100%)
- Captures lead information
- Triggers email with PDF guide

Update quiz submission in `src/pages/Quiz.tsx` to call your edge function:

```typescript
const response = await supabase.functions.invoke('capture-lead', {
  body: {
    name: data.name,
    email: data.email,
    language: data.language,
    wechat: data.wechat,
    clarityScore: score,
    answers: answers,
  },
});
```

## 🎨 Customization

### Brand Colors

Edit `src/index.css` to change colors:

```css
--brand-primary: 185 81% 13%; /* Deep Teal */
--brand-accent: 41 72% 60%;   /* Warm Gold */
--brand-cta: 10 68% 51%;      /* Bold Red */
```

### Content

All English content is in `src/i18n/en/*.json`. Edit these files to update copy.

### Images

Replace generated images in `src/assets/images/` with your own:
- `hero.jpg` - Main hero image
- `icon-clarity.png` - Value proposition icons
- `icon-confidence.png`
- `icon-growth.png`

## 📊 Analytics Events

Track custom events using the analytics utility:

```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent('button_click', { 
  button: 'book_session',
  page: 'home' 
});
```

Pre-configured events:
- `lead_magnet_submit` - Quiz completion
- `pageview` - Automatic page views

## 🚀 Deployment

### Via Lovable
Click "Publish" in the Lovable editor

### Manual Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

Recommended hosting:
- Vercel
- Netlify
- Cloudflare Pages

## 🔧 Troubleshooting

### Translations not working
- Check `VITE_TRANSLATE_API` is set
- Ensure LibreTranslate API is accessible
- Check browser console for errors

### Analytics not tracking
- Verify API keys in `.env`
- Check browser console for PostHog/Umami errors
- Clear localStorage and try again

### Email not sending
- Verify domain is verified in Resend
- Check `RESEND_API_KEY` secret is set
- Review edge function logs in Lovable Cloud

## 📚 Resources

- [Lovable Docs](https://docs.lovable.dev/)
- [Lovable Cloud](https://docs.lovable.dev/features/cloud)
- [LibreTranslate](https://libretranslate.com/)
- [Umami Analytics](https://umami.is/)
- [PostHog](https://posthog.com/)
- [Resend](https://resend.com/)
- [Airwallex](https://www.airwallex.com/)

## 🎯 Conversion Optimization

Target metrics:
- **Quiz Start Rate**: 15-25% of visitors
- **Quiz Completion Rate**: 70-80% of starters
- **Lead Capture Rate**: 20-30% of completers
- **Overall CVR**: 2-6% of total visitors

Monitor these in your analytics dashboard and optimize accordingly.

## 📞 Support

For issues or questions:
- Check the README.md
- Review Lovable documentation
- Contact: hello@zhengrowth.com
