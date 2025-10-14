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

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Configuration

1. Copy `.env.example` to `.env`
2. Configure your environment variables:
   - Analytics keys (optional)
   - Translation API (free tier available)
   - Payment gateway credentials

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── i18n/            # Internationalization
│   └── en/         # English translations
├── lib/            # Utilities and helpers
├── assets/         # Images and media
└── analytics/      # Analytics utilities
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
