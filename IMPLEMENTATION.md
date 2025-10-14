# ZhenGrowth Implementation Guide

Complete guide to implementing and deploying the full ZhenGrowth platform.

## ✅ What's Already Built

### Core Pages
- ✅ Home page with hero, values, testimonials, and CTAs
- ✅ Enhanced booking flow with Cal.com integration
- ✅ Multi-step quiz with lead capture
- ✅ Coaching programs page with packages and FAQs
- ✅ Payment page with Airwallex integration
- ✅ Blog listing page
- ✅ Contact, About, Privacy, Terms pages
- ✅ Thank you page with next steps

### Features
- ✅ Multi-language support (EN, 繁體中文, 简体中文)
- ✅ Auto-translation via LibreTranslate API
- ✅ Analytics tracking (Umami + PostHog)
- ✅ Event funnel tracking for conversions
- ✅ Responsive design system with brand colors
- ✅ SEO optimization (sitemap, robots.txt, hreflang)
- ✅ Beautiful animations and transitions

## 🔧 Setup Steps

### 1. Cal.com Booking Integration

**Setup:**
1. Sign up at https://cal.com (free account)
2. Create an event type called "discovery" (30 min)
3. Update your Cal.com username in `src/pages/BookSession.tsx`:
   ```tsx
   <Cal calLink="YOUR-USERNAME/discovery" />
   ```
4. Cal.com will handle:
   - Calendar availability
   - Zoom link generation
   - Email confirmations
   - Rescheduling/cancellations

**Cost:** Free tier available

### 2. Airwallex Payment Integration

**Setup:**
1. Sign up at https://www.airwallex.com/
2. Complete business verification
3. Get API credentials from dashboard
4. Add to environment variables:
   ```env
   AIRWALLEX_API_KEY=your_api_key
   AIRWALLEX_CLIENT_ID=your_client_id
   ```

**Features:**
- Accepts WeChat Pay, Alipay, credit cards
- Hosted checkout page (no PCI compliance needed)
- Multi-currency support
- Automatic receipt emails

**Development Mode:**
- Without credentials, API returns mock payment URLs
- Test the flow without real payments

**Cost:** Transaction fees apply (check Airwallex pricing)

### 3. Analytics Setup

#### Umami (Free & Self-Hosted)

**Option A: Use Umami Cloud (Easiest)**
1. Sign up at https://cloud.umami.is/
2. Add website
3. Copy website ID
4. Replace `VITE_UMAMI_WEBSITE_ID` in `index.html` with your actual ID

**Option B: Self-Host on Supabase (Free)**
1. Enable Lovable Cloud (gives you Supabase Postgres)
2. Clone Umami: https://github.com/umami-software/umami
3. Deploy to Vercel with Supabase connection
4. Update script src in `index.html`

#### PostHog (Optional - Advanced Funnels)

**Setup:**
1. Sign up at https://posthog.com/ (free tier available)
2. Create project
3. Copy API key
4. Add to `.env`:
   ```env
   VITE_POSTHOG_KEY=phc_your_actual_key
   ```

**What it tracks:**
- User funnels (quiz → booking → payment)
- Session recordings (optional)
- Feature flags (optional)
- Cohort analysis

**Cost:** Free up to 1M events/month

### 4. Backend Setup (Lead Capture & Emails)

**Enable Lovable Cloud:**

<lov-actions>
<parameter name="open-backend">Connect Lovable Cloud</lov-parameter>
</lov-actions>

After enabling:

#### Create Leads Table

```sql
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Anyone can submit lead" ON leads
  FOR INSERT
  WITH CHECK (true);
```

#### Set up Email Sending (Resend)

1. Sign up at https://resend.com
2. Verify your domain
3. Create API key
4. Add as Lovable Cloud secret: `RESEND_API_KEY`

#### Create Edge Function for Quiz Submission

Create `supabase/functions/capture-quiz-lead/index.ts`:

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Save lead
    await supabase.from('leads').insert({
      name,
      email,
      language,
      wechat,
      clarity_score: clarityScore,
      quiz_answers: answers,
      source: 'quiz',
    });

    // Send email with 7-Day Clarity Sprint PDF
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    await resend.emails.send({
      from: 'ZhenGrowth <hello@zhengrowth.com>',
      to: [email],
      subject: 'Your 7-Day Clarity Sprint Guide',
      html: `
        <h1>Thank you, ${name}!</h1>
        <p>Your clarity score: <strong>${clarityScore}%</strong></p>
        <p><a href="https://zhengrowth.com/downloads/7-day-clarity-sprint.pdf">Download your free guide here</a></p>
        <p>Let's continue the conversation - book your free discovery session.</p>
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
[functions.capture-quiz-lead]
verify_jwt = false
```

### 5. Update Quiz Submission

In `src/pages/Quiz.tsx`, update the `onSubmit` function:

```typescript
const onSubmit = async (data: FormData) => {
  const score = calculateScore();
  
  try {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );

    const { error } = await supabase.functions.invoke('capture-quiz-lead', {
      body: {
        name: data.name,
        email: data.email,
        language: data.language,
        wechat: data.wechat,
        clarityScore: score,
        answers: answers,
      },
    });

    if (error) throw error;

    // Track success
    if (window.umami) {
      window.umami('lead_magnet_submit', { score });
    }

    toast.success('Success! Check your email for the 7-Day Clarity Sprint guide.');
    setShowForm(false);
  } catch (error) {
    toast.error('Something went wrong. Please try again.');
  }
};
```

### 6. SEO Optimization

**Already Implemented:**
- ✅ Sitemap.xml with hreflang tags
- ✅ Robots.txt configured
- ✅ Meta tags (title, description, OG, Twitter)
- ✅ Semantic HTML structure
- ✅ Alt text on all images

**To Optimize Further:**
1. Add JSON-LD structured data for Articles and FAQs
2. Implement lazy loading for images
3. Add canonical tags
4. Create blog posts with SEO-optimized content
5. Build backlinks from relevant sites

### 7. Performance Optimization

**Checklist:**
- [ ] Compress hero image (use AVIF/WEBP)
- [ ] Enable Cloudflare or CDN
- [ ] Implement image lazy loading
- [ ] Minify JavaScript and CSS (Vite does this)
- [ ] Enable gzip compression
- [ ] Target Core Web Vitals:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

## 📱 Mobile App (Future Phase)

The platform is ready for Expo/React Native wrapping:

1. Create Expo project
2. Use React Native WebView for booking/payments
3. Add native features:
   - Push notifications (Expo Push)
   - Offline PDF library
   - Deep linking to web pages
4. Submit to App Store & Play Store

**Estimated effort:** 2-3 weeks for basic app

## 🚀 Deployment

### Web App

**Option 1: Netlify (Recommended)**
```bash
# Build
npm run build

# Deploy
npx netlify-cli deploy --prod --dir=dist
```

**Option 2: Vercel**
```bash
npm run build
npx vercel --prod
```

**Option 3: Cloudflare Pages**
- Connect GitHub repo
- Build command: `npm run build`
- Output directory: `dist`

### Custom Domain

1. Purchase domain (Namecheap, GoDaddy, etc.)
2. Add DNS records:
   ```
   A    @    <deployment-ip>
   CNAME www  <deployment-url>
   ```
3. Configure SSL certificate (automatic on Netlify/Vercel)

## 📊 Success Metrics

Track these KPIs in your analytics:

**Lead Generation:**
- Quiz start rate: 15-25% target
- Quiz completion rate: 70-80% target
- Lead capture rate: 20-30% target
- **Overall CVR: 2-6%**

**Booking Funnel:**
- Book page views
- Form submissions
- Calendar opens
- Booked sessions

**Payment Funnel:**
- Pay page views
- Payment initiated
- Payment completed
- Average order value

**Engagement:**
- Session duration buckets
- Pages per session
- Blog read time
- Return visitor rate

## 🔒 Security & Compliance

**GDPR/Privacy:**
- ✅ Privacy policy
- ✅ Cookie notice (Umami is cookie-free)
- ✅ Data encryption (Supabase)
- ✅ Email opt-in consent

**Form Protection:**
- Optional: Add hCaptcha to forms
- Rate limiting on API endpoints
- Input validation on all forms

## 🎯 Next Steps

1. **Week 1:**
   - Set up Cal.com
   - Configure Airwallex
   - Test booking flow end-to-end

2. **Week 2:**
   - Enable Lovable Cloud
   - Create leads table
   - Set up Resend emails
   - Deploy edge functions

3. **Week 3:**
   - Configure analytics (Umami + PostHog)
   - Test quiz → email flow
   - Deploy to production

4. **Week 4:**
   - Add blog content (3-5 posts)
   - Set up custom domain
   - Launch marketing campaigns

## 💡 Tips for Success

1. **Start with Discovery Sessions:** Build trust before selling packages
2. **Optimize Quiz:** A/B test questions and lead magnet offer
3. **Track Everything:** Use analytics to find bottlenecks
4. **Content Marketing:** Publish weekly blog posts for SEO
5. **Email Nurture:** Build automated email sequences
6. **Social Proof:** Collect and display testimonials

## 📞 Support

- **Docs:** https://docs.lovable.dev/
- **Community:** https://discord.gg/lovable
- **Email:** support@lovable.dev

---

**Ready to launch?** Follow the setup steps above and you'll have a professional coaching platform generating leads within 2-3 weeks! 🚀
