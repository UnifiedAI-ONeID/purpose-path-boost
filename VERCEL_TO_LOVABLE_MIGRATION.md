# Vercel to Lovable Cloud Migration

## Overview
This document tracks the migration from Vercel serverless functions (`/api`) to Lovable Cloud (Supabase Edge Functions).

## Migration Status

### Phase 1: Core API Routes ✅
- [x] `/api/version` → `api-version`
- [x] `/api/coaching/*` → Edge Functions
- [x] `/api/admin/check-role` → `api-admin-check-role`
- [x] `/api/testimonials/list` → `api-testimonials-list`
- [x] `/api/contact/submit` → `api-contact-submit`
- [x] `/api/cal/book-url` → `api-cal-book-url`

### Phase 2: Admin Routes ✅
- [x] `/api/admin/bookings` → `api-admin-bookings`
- [x] `/api/admin/coaching/*` → `api-admin-coaching-*`
- [x] `/api/admin/coupons/*` → `api-admin-coupons-*`
- [x] `/api/admin/seo/alerts` → `api-admin-seo-alerts`
- [x] `/api/admin/calendar-feed` → `api-admin-calendar-feed`

### Phase 3: Feature Routes ✅
- [x] `/api/lessons/*` → `api-lessons-*`
- [x] `/api/telemetry/log` → `api-telemetry-log`
- [x] `/api/referral/track` → `api-referral-track`
- [x] `/api/admin/fx/*` → Edge Functions ✅
- [x] `/api/admin/pricing/*` → Edge Functions ✅
- [x] `/api/admin/seo/resolve` → Edge Function ✅
- [x] `/api/admin/tickets/overrides` → Edge Function ✅
- [x] `/api/events/*` → Edge Functions ✅ (get, price-preview, tickets, coupon-preview)
- [x] `/api/express/*` → Edge Functions ✅ (create, webhook, price)
- [x] `/api/paywall/*` → Edge Functions ✅ (can-watch, mark-watch)
- [x] `/api/nudge/pull` → Edge Function ✅
- [x] `/api/quiz/answer` → Edge Function ✅
- [x] `/api/badges/award` → Edge Function ✅
- [x] `/api/admin/bump-version` → Edge Function ✅
- [x] `/api/ai/status` → Edge Function ✅

### Phase 4: Cleanup ✅
- [x] Core migration complete (~60 routes)
- [ ] Remove `/api` folder (keep for reference)
- [ ] Remove `vercel.json` (optional)
- [ ] Remove `@vercel/node` dependency (optional)

### Phase 5: Final Routes ✅
- [x] `/api/lessons/continue` → Edge Function ✅
- [x] `/api/lessons/get` → Edge Function ✅
- [x] `/api/coaching/checkout` → Edge Function ✅
- [x] `/api/coaching/recommend` → Edge Function ✅
- [x] `/api/coaching/redeem` → Edge Function ✅
- [x] `/api/events/register` → Edge Function ✅
- [x] `/api/events/offer-accept` → Edge Function ✅
- [x] `/api/me/summary` → Edge Function ✅
- [x] `/api/churn/intent` → Edge Function ✅

## Progress: ✅ MIGRATION COMPLETE - ~69 of 70+ API routes migrated

All critical user-facing and admin routes are now on Lovable Cloud Edge Functions!

## Architecture Changes

### Before (Vercel)
```typescript
// api/version.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ v: 1 });
}

// Frontend
fetch('/api/version')
```

### After (Lovable Cloud)
```typescript
// supabase/functions/api-version/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(JSON.stringify({ v: 1 }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Frontend
supabase.functions.invoke('api-version')
```

## Key Differences

1. **Request/Response**: Deno Request/Response vs Vercel VercelRequest/VercelResponse
2. **CORS**: Must manually add CORS headers in Edge Functions
3. **Environment**: Deno.env.get() vs process.env
4. **Invocation**: supabase.functions.invoke() vs fetch('/api/')
5. **Auth**: Direct JWT verification vs middleware-style auth
6. **Deployment**: Auto-deployed with Lovable vs Vercel CLI

## Benefits
- ✅ Native Lovable Cloud integration
- ✅ No external dependencies
- ✅ Automatic scaling
- ✅ Consistent with existing edge functions
- ✅ Better error handling
- ✅ Direct Supabase client access
