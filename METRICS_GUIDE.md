# Event Metrics System

This project now has a comprehensive event tracking system with two parallel approaches:

## 1. Legacy Analytics (Umami/PostHog)
Located in `src/analytics/events.ts` - for existing analytics setup

## 2. New Metrics System
Located in `src/lib/metricsTracker.ts` - detailed event tracking stored in your database

---

## Quick Start

### Track Events in Your Code

```typescript
import { trackEvent, tracking } from '@/lib/trackEvent';

// Basic event tracking
trackEvent('custom_event', { key: 'value' });

// Convenience methods
tracking.ctaClick('Book Now', 'hero_section');
tracking.bookingStarted();
tracking.bookingCompleted();
tracking.quizCompleted(85);
tracking.blogRead('my-post-slug', 'Growth');
```

### View Metrics in Admin Dashboard

1. Log in as admin
2. Go to Admin Dashboard → **Metrics** tab
3. View real-time analytics, conversion funnels, and top pages

---

## Database Tables

### `events_raw`
Stores all raw events with:
- Timestamp, session ID
- Hashed IP (privacy-first)
- Event name, route, referrer
- UTM parameters
- Device type, language, country
- Custom metadata

### `rollup_daily`
Daily aggregated metrics for fast querying

### `posts`
New JSON-based blog posts table (alongside existing `blog_posts`)
- Stores TipTap editor JSON
- Supports scheduled publishing
- Social media cross-posting configuration

---

## Edge Functions

### `metrics-collect`
- **URL**: `/functions/v1/metrics-collect`
- **Auth**: No JWT required (public)
- **Purpose**: Collects events from frontend
- Respects Do Not Track (DNT) header
- Hashes IPs for privacy

### `metrics-rollup`
- **URL**: `/functions/v1/metrics-rollup`
- **Auth**: No JWT required (can be called via cron)
- **Purpose**: Daily aggregation of metrics
- Run manually or via cron: `0 15 * * *` (3:15 AM daily)

---

## Auto-Tracking

The metrics tracker automatically tracks:
- ✅ Page views on route changes
- ✅ Session duration
- ✅ Device type (mobile/tablet/desktop)
- ✅ UTM parameters
- ✅ Referrer

---

## Privacy Features

1. **IP Hashing**: IPs are hashed with a salt before storage
2. **Do Not Track**: Respects browser DNT header
3. **No PII**: No personally identifiable information stored
4. **Admin-only Access**: All metrics queries require admin authentication

---

## Analytics Functions

### Query Metrics Summary

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data } = await supabase.rpc('admin_metrics_summary', {
  p_from: '2025-01-01',
  p_to: '2025-01-31'
});

// Returns:
// - totals: event counts
// - routes: top pages
// - funnel: conversion rates
// - daily: time series data
```

---

## Conversion Funnel

Tracks user journey:
1. **CTA Click** → `cta_click` event
2. **Booking Started** → `book_start` event  
3. **Booking Completed** → `book_complete` event

Calculate conversion rate:
```
Conversion % = (booked_sessions / cta_sessions) × 100
```

---

## Blog Posts System

### Two Approaches Available

#### 1. Legacy: `blog_posts` table
- Uses Markdown content
- Existing BlogEditor component
- Simple text-based storage

#### 2. New: `posts` table
- Uses TipTap JSON + HTML
- Rich formatting support
- Scheduled publishing
- Social media overrides per post

---

## Social Media Config

Encrypted credentials stored in `social_configs`:
- AES-256-GCM encryption
- Webhook-based posting (recommended)
- Per-platform custom templates
- Connection testing

---

## Setup Checklist

### Required Secrets

- [x] `SECRET_MASTER_KEY` - 32-byte base64 for encrypting social credentials
- [x] `METRICS_SALT` - Salt for hashing IPs

### Optional for Direct API Posting

- [ ] `TWITTER_API_KEY`
- [ ] `TWITTER_API_SECRET`
- [ ] `TWITTER_ACCESS_TOKEN`
- [ ] `TWITTER_ACCESS_TOKEN_SECRET`

**Recommended**: Use webhooks (n8n/Zapier) instead of direct API keys

---

## Best Practices

1. **Track Meaningful Events**: Only track events that help you understand user behavior
2. **Use Descriptive Names**: `book_start` not `click_button`
3. **Add Context**: Include relevant properties (`button`, `location`, `category`)
4. **Respect Privacy**: Never track PII
5. **Test in Dev**: Check console for `[Metrics]` logs

---

## Troubleshooting

### Events not showing up?
- Check browser console for `[Metrics]` logs
- Verify `metrics-collect` function is deployed
- Check admin access (profiles table)

### Conversion funnel incomplete?
- Ensure you're tracking all funnel events:
  - `cta_click`
  - `book_start`
  - `book_complete`

### Admin dashboard empty?
- Make sure first user has `is_admin = true` in `profiles` table
- Run: `UPDATE profiles SET is_admin = true WHERE user_id = 'YOUR_USER_ID';`

---

## Future Enhancements

- [ ] Real-time dashboard updates (via Supabase Realtime)
- [ ] Cohort analysis
- [ ] A/B test tracking
- [ ] Heatmap data collection
- [ ] Session replay metadata
- [ ] Custom event definitions in UI

---

For questions, check the code comments in:
- `src/lib/metricsTracker.ts`
- `supabase/functions/metrics-collect/index.ts`
- `src/components/MetricsSummary.tsx`
