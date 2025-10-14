# ZhenGrowth - Professional Coaching Platform

A premium multi-language coaching website built with React, TypeScript, and TailwindCSS.

## Features

- 🌍 **Multi-language Support** (EN, 繁體中文, 简体中文) with automatic translation
- 🎨 **Beautiful Design System** with custom color palette and animations
- 📊 **Lead Generation Quiz** with clarity assessment
- 📧 **Email Collection** with lead magnet (7-Day Clarity Sprint)
- 📈 **Analytics Integration** (Umami + PostHog)
- 💳 **Payment Ready** (Airwallex integration prepared)
- ⚡ **Fast & Modern** (Vite, React 18, TypeScript)
- 📱 **Fully Responsive** with mobile-first design

## 🚀 Quick Start

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:8080`

### 🌏 Building for Different Regions

**Global Build** (default):
```bash
npm run build
```

**China Build** (optimized for China):
```bash
VITE_REGION=china npm run build
```

The China build automatically uses:
- Baidu Tongji instead of Umami/PostHog
- Feishu forms instead of Cal.com
- AMap instead of Google Maps
- BootCDN for faster asset loading

See **IMPLEMENTATION.md** section 13 for full China deployment guide.

## 🎯 What's Built

### Core Features

- ✅ **Multi-language support** (EN, 繁體中文, 简体中文) with auto-translation
- ✅ **Enhanced booking flow** with Cal.com integration
- ✅ **Interactive quiz** with lead capture & email automation
- ✅ **Coaching programs page** with 4 package tiers
- ✅ **Payment integration** with Airwallex (WeChat Pay, Alipay, Cards)
- ✅ **Blog system** ready for MDX posts
- ✅ **Analytics** (Umami + PostHog) with event funnels
- ✅ **SEO optimized** (sitemap, hreflang, meta tags)
- ✅ **Responsive design** with beautiful animations

## 📋 Setup Guide

### 1. Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

**Required for Production:**
- `RESEND_API_KEY` - Already configured in Lovable Cloud secrets
- Update Umami Website ID in `index.html` (replace `YOUR_UMAMI_WEBSITE_ID`)

**Optional:**
- `VITE_POSTHOG_KEY` - For advanced analytics funnels
- `AIRWALLEX_API_KEY` + `AIRWALLEX_CLIENT_ID` - For payments
- `VITE_HCAPTCHA_SITE_KEY` - For spam protection

See **DEPLOYMENT.md** for complete checklist.

### 2. Required Actions Before Launch

1. **Verify Resend Domain** (Critical for emails)
   ```
   1. Go to https://resend.com/domains
   2. Add and verify zhengrowth.com
   3. Update edge function "from" address to hello@zhengrowth.com
   ```

2. **Create Lead Magnet PDF**
   ```
   - Add to: /public/downloads/7-day-clarity-sprint.pdf
   - See: /public/downloads/README.md for content ideas
   ```

3. **Configure Cal.com**
   ```
   1. Sign up at https://cal.com
   2. Create "discovery" event type (30min)
   3. Update in src/pages/BookSession.tsx:
      <Cal calLink="YOUR-USERNAME/discovery" />
   ```

4. **Setup Umami Analytics**
   ```
   1. Sign up: https://cloud.umami.is/
   2. Add website
   3. Replace YOUR_UMAMI_WEBSITE_ID in index.html with actual ID
   ```

### 3. Test the Full Flow

```bash
# 1. Start dev server
npm run dev

# 2. Take quiz at /quiz
# 3. Submit form
# 4. Check email (if Resend domain verified)
# 5. Monitor backend:
```

<lov-actions>
  <lov-open-backend>View Backend</lov-open-backend>
</lov-actions>

## 📊 Key Metrics Tracked

- `lm_view` / `lm_submit` - Lead magnet funnel
- `quiz_complete` - Quiz completions
- `book_view` / `book_start` / `book_complete` - Booking funnel
- `pay_click` / `pay_success` / `pay_fail` - Payment funnel
- `blog_read` - Blog engagement
- `session_bucket_*` - Session duration

Target CVR: 20-30% (quiz completion → email capture)

## 🎨 Design System

All colors and styles defined in:
- `src/index.css` - CSS variables
- `tailwind.config.ts` - Tailwind tokens

Brand colors:
- Primary: `#0B3D3C` (Deep Teal)
- Accent: `#E8B44D` (Warm Gold)
- CTA: `#D9462E` (Bold Red)

## 🗂️ Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Header.tsx   # Sticky header with language switcher
│   ├── Footer.tsx   # Footer with social links
│   ├── MapCN.tsx    # AMap component for China
│   └── ui/          # shadcn/ui components
├── pages/           # Page components
│   ├── Home.tsx              # Landing page
│   ├── CoachingPrograms.tsx  # Coaching packages
│   ├── BookSession.tsx       # Cal.com booking (global)
│   ├── BookSession.cn.tsx    # Feishu booking (China)
│   ├── Payment.tsx           # Payment page
│   ├── Quiz.tsx              # Lead magnet quiz
│   ├── BlogList.tsx          # Blog listing
│   └── ThankYou.tsx          # Confirmation page
├── i18n/            # Internationalization
│   ├── index.ts     # i18next config
│   └── en/          # English translations
├── lib/             # Utilities
│   ├── airwallex.ts # Payment integration
│   ├── analytics.ts # Analytics utilities
│   ├── analytics-cn.ts # Baidu Tongji (China)
│   └── region.ts    # Region detection
├── analytics/       # Event tracking
│   └── events.ts    # Unified tracking
└── layouts/         # Layout wrappers
    └── MainLayout.tsx

api/
└── create-payment-link.ts  # Airwallex API endpoint

edge/
└── country-redirect-worker.js  # Cloudflare geo-routing

public/
├── sitemap.xml      # SEO sitemap
└── robots.txt       # Crawler config

index-cn.html        # China-specific HTML with Baidu Tongji
```

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **i18n**: i18next with auto-translation
- **Animations**: Framer Motion
- **Analytics**: Umami + PostHog
- **Build**: Vite

## Key Pages

- `/` - Home with hero section and testimonials
- `/quiz` - Interactive clarity assessment
- `/coaching` - Coaching services
- `/book` - Session booking
- `/blog` - Blog and resources
- `/about` - About page
- `/contact` - Contact form

## Design System

The project uses a comprehensive design system defined in:
- `src/index.css` - CSS variables and tokens
- `tailwind.config.ts` - TailwindCSS configuration

### Brand Colors
- Primary: Deep Teal (#0B3D3C)
- Accent: Warm Gold (#E8B44D)
- CTA: Bold Red (#D9462E)
- Dark: Rich Black (#0E0E0F)
- Light: Soft White (#F7F7F8)

### Typography
- Headings: Noto Serif SC
- Body: Inter

## Lead Capture Flow

1. User takes the clarity quiz (10 questions)
2. Receives personalized score and interpretation
3. Enters contact details to get the free 7-Day Clarity Sprint PDF
4. Lead data saved and confirmation email sent
5. Analytics events tracked for conversion optimization

Target CVR: 20-30%

## Analytics Events

- `lead_magnet_submit` - Quiz completion with email
- Custom events can be added via `trackEvent()` utility

## 🚀 Quick Deploy

**Option 1: Deploy via Lovable** (Easiest)
1. Click **Publish** button in Lovable editor
2. Connect custom domain
3. Done! 🎉

**Option 2: Deploy to Vercel/Netlify**
See **DEPLOYMENT.md** for step-by-step instructions.

**Option 3: China Mirror Build**
```bash
VITE_REGION=china npm run build
# Deploy to cn.zhengrowth.com
```

## 📚 Documentation

- **DEPLOYMENT.md** - Complete deployment checklist with all required configurations
- **IMPLEMENTATION.md** - Detailed technical implementation guide including China deployment
- **public/downloads/README.md** - Guide to creating your lead magnet PDF

## 🎯 What's Next?

After deploying, follow **DEPLOYMENT.md** to:
1. ✅ Configure all API integrations
2. ✅ Create lead magnet PDF
3. ✅ Test quiz → email flow
4. ✅ Monitor analytics and conversions
5. ✅ Publish blog content for SEO

Target metrics (first 30 days):
- Lead magnet CVR: 20-30%
- Email open rate: 40-60%
- Booking rate: 15-25% of leads

## License

© 2025 ZhenGrowth. All rights reserved.
