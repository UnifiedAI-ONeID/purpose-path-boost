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

### Phase 3: Feature Routes (In Progress)
- [x] `/api/lessons/*` → `api-lessons-*`
- [x] `/api/telemetry/log` → `api-telemetry-log`
- [x] `/api/referral/track` → `api-referral-track`
- [ ] `/api/admin/fx/*` → Edge Functions (remaining)
- [ ] `/api/admin/pricing/*` → Edge Functions (remaining)
- [ ] `/api/admin/seo/resolve` → Edge Function (remaining)
- [ ] `/api/events/*` → Edge Functions (remaining)
- [ ] `/api/express/*` → Edge Functions (partial)
- [ ] `/api/paywall/*` → Edge Functions (remaining)

### Phase 4: Cleanup (Pending)
- [ ] Remove `/api` folder
- [ ] Remove `vercel.json`
- [ ] Remove `@vercel/node` dependency

## Progress: ~35 of 60+ API routes migrated to Edge Functions

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
