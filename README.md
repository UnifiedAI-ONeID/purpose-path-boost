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

Update with your credentials (see IMPLEMENTATION.md for detailed setup).

### 2. Cal.com Integration

1. Sign up at https://cal.com
2. Create "discovery" event type
3. Update username in `src/pages/BookSession.tsx`

### 3. Payment Setup

1. Sign up at https://www.airwallex.com/
2. Get API credentials
3. Add to `.env`:
   ```env
   AIRWALLEX_API_KEY=your_key
   AIRWALLEX_CLIENT_ID=your_id
   ```

### 4. Analytics

**Umami (Free):**
- Sign up at https://cloud.umami.is/
- Replace website ID in `index.html`

**PostHog (Optional):**
- Sign up at https://posthog.com/
- Add key to `.env`

### 5. Backend (Lead Capture)

Enable Lovable Cloud for:
- Lead database
- Email automation (Resend)
- Edge functions

See IMPLEMENTATION.md for detailed backend setup.

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
│   └── ui/          # shadcn/ui components
├── pages/           # Page components
│   ├── Home.tsx              # Landing page
│   ├── CoachingPrograms.tsx  # Coaching packages
│   ├── BookSession.tsx       # Multi-step booking
│   ├── Payment.tsx           # Payment page
│   ├── Quiz.tsx              # Lead magnet quiz
│   ├── BlogList.tsx          # Blog listing
│   └── ThankYou.tsx          # Confirmation page
├── i18n/            # Internationalization
│   ├── index.ts     # i18next config
│   └── en/          # English translations
├── lib/             # Utilities
│   ├── airwallex.ts # Payment integration
│   └── analytics.ts # Analytics utilities
├── analytics/       # Event tracking
│   └── events.ts    # Unified tracking
└── layouts/         # Layout wrappers
    └── MainLayout.tsx

api/
└── create-payment-link.ts  # Airwallex API endpoint

public/
├── sitemap.xml      # SEO sitemap
└── robots.txt       # Crawler config
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

## Deployment

Built with Lovable - deploy directly from the platform or build locally:

```bash
npm run build
# Deploy the `dist` folder to your hosting provider
```

## License

© 2025 ZhenGrowth. All rights reserved.
