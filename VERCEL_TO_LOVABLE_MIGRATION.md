# Vercel to Lovable Cloud Migration

## Overview
This document tracks the migration from Vercel serverless functions (`/api`) to Lovable Cloud (Supabase Edge Functions).

## Migration Status

### Phase 1: Core API Routes ✅
- [x] `/api/version` → Edge Function `api-version`
- [x] `/api/coaching/*` → Edge Functions `api-coaching-*`
- [x] `/api/admin/check-role` → Edge Function `api-admin-check-role`
- [x] `/api/testimonials/list` → Edge Function `api-testimonials-list`

### Phase 2: Admin Routes (In Progress)
- [ ] `/api/admin/bookings` → Edge Function
- [ ] `/api/admin/coaching/*` → Edge Functions
- [ ] `/api/admin/coupons/*` → Edge Functions
- [ ] `/api/admin/fx/*` → Edge Functions
- [ ] `/api/admin/pricing/*` → Edge Functions
- [ ] `/api/admin/seo/*` → Edge Functions
- [ ] `/api/admin/self` → Edge Function

### Phase 3: Feature Routes
- [ ] `/api/cal/*` → Edge Functions
- [ ] `/api/calendar/*` → Edge Functions
- [ ] `/api/contact/submit` → Edge Function
- [ ] `/api/events/*` → Edge Functions
- [ ] `/api/express/*` → Edge Functions (some exist)
- [ ] `/api/lessons/*` → Edge Functions
- [ ] `/api/nudge/*` → Edge Functions (some exist)
- [ ] `/api/referral/*` → Edge Function
- [ ] `/api/telemetry/*` → Edge Function
- [ ] `/api/paywall/*` → Edge Functions
- [ ] `/api/social/*` → Edge Functions (mostly exist)

### Phase 4: Cleanup
- [ ] Remove `/api` folder
- [ ] Remove `vercel.json`
- [ ] Update `vite.config.ts`
- [ ] Remove `@vercel/node` dependency

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
