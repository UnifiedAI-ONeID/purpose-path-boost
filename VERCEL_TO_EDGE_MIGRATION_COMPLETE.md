# Vercel API to Supabase Edge Functions Migration - Complete

## Migration Summary

All legacy Vercel API routes from `/api/**/*.ts` have been fully migrated to Supabase Edge Functions in `supabase/functions/`. The `/api` folder has been removed as it's no longer needed.

## What Was Migrated

### 1. **Core API Routes (88 files)**
All Vercel API endpoints have corresponding Edge Functions:
- Admin routes (`/api/admin/*` → `supabase/functions/api-admin-*`)
- Coaching routes (`/api/coaching/*` → `supabase/functions/api-coaching-*`)
- Event routes (`/api/events/*` → `supabase/functions/api-events-*`)
- Billing routes (`/api/billing/*` → `supabase/functions/api-billing-*`)
- Calendar routes (`/api/calendar/*` → `supabase/functions/api-calendar-*`)
- And all others...

### 2. **Shared Utilities**
All utility functions from `/api/_util/` have been migrated to `supabase/functions/_shared/`:

| Old Path | New Path | Purpose |
|----------|----------|---------|
| `api/_util/discount.ts` | `supabase/functions/_shared/discounts.ts` | Generic discount calculations |
| `api/_util/i18n.ts` | `supabase/functions/_shared/i18n.ts` | Internationalization helpers |
| `api/_util/schema.ts` | `supabase/functions/_shared/validators.ts` | JSON validation utilities |
| `api/_util/cache.ts` | `supabase/functions/_shared/cache.ts` | In-memory caching |
| `api/_util/strictFetch.ts` | `supabase/functions/_shared/http.ts` | HTTP utilities with timeout |
| N/A | `supabase/functions/_shared/event-coupons.ts` | Event coupon logic |
| N/A | `supabase/functions/_shared/event-pricing.ts` | Event pricing with FX |
| N/A | `supabase/functions/_shared/admin-auth.ts` | Admin authentication |

## Client-Side Changes

### Before (Vercel)
```typescript
const response = await fetch('/api/coaching/list', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ locale: 'en' })
});
const data = await response.json();
```

### After (Edge Functions)
```typescript
import { invokeApi } from '@/lib/api-client';

const result = await invokeApi('/api/coaching/list', {
  method: 'POST',
  body: { locale: 'en' }
});
```

### Benefits
- ✅ **Automatic JSON handling** - No manual stringify/parse
- ✅ **Consistent error handling** - Standardized responses
- ✅ **Type safety** - Better TypeScript support
- ✅ **Auth integration** - Supabase JWT automatically included

## Edge Function Structure

### Standard Pattern
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Your logic here
    const { data, error } = await supabase
      .from('table')
      .select('*');

    if (error) {
      return errorResponse(error.message);
    }

    return jsonResponse({ ok: true, data });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
});
```

## Configuration

### JWT Verification (`supabase/config.toml`)
- **Public endpoints** (no auth required): `verify_jwt = false`
  - Examples: `/api/coaching/list`, `/api/events/get`, `/api/contact/submit`
- **Protected endpoints** (auth required): `verify_jwt = true`
  - Examples: All `/api/admin/*` routes, user-specific data

### CORS Headers
All Edge Functions include proper CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Shared Utilities Usage

### Discount Calculations
```typescript
import { applyDiscount } from '../_shared/discounts.ts';

const finalPrice = applyDiscount({
  baseCents: 10000,
  currency: 'USD',
  percent_off: 20,
  amount_off_cents: 500
});
```

### Internationalization
```typescript
import { pickFields, getLangFromBody } from '../_shared/i18n.ts';

const lang = getLangFromBody(body);
const localized = pickFields(row, lang);
```

### Caching
```typescript
import { getCache, setCache } from '../_shared/cache.ts';

const cached = getCache('my-key', 300); // 5 min TTL
if (!cached) {
  const fresh = await fetchData();
  setCache('my-key', fresh);
}
```

### Validation
```typescript
import { validateEmail, sanitizeEmail } from '../_shared/validators.ts';

if (!validateEmail(email)) {
  return errorResponse('Invalid email format');
}
const clean = sanitizeEmail(email);
```

## Testing

### Local Testing
```bash
# Start Supabase locally
supabase start

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/api-coaching-list' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"locale":"en"}'
```

### Production
Edge Functions are automatically deployed when you push code to the Lovable platform.

## Performance Benefits

1. **Lower Latency**: Edge Functions run closer to users globally
2. **Better Scaling**: Automatic scaling without cold starts (after warmup)
3. **Cost Efficiency**: Pay only for execution time
4. **Unified Platform**: No separate Vercel deployment needed

## Security Improvements

1. **RLS Integration**: Direct connection to Supabase with RLS policies
2. **JWT Validation**: Built-in authentication for protected routes
3. **No CORS Issues**: Proper configuration from the start
4. **Environment Secrets**: Secure secret management via Supabase

## Rollback (If Needed)

If you ever need to reference old Vercel API logic:
1. Check git history for `/api` folder
2. All logic is preserved in Edge Functions
3. Shared utilities maintain same interfaces

## Next Steps

- ✅ Migration complete
- ✅ All endpoints tested and working
- ✅ Shared utilities created and documented
- ✅ Legacy `/api` folder removed
- ✅ Client code updated to use `invokeApi()`

## Support

For issues or questions:
1. Check `supabase/functions/_shared/` for utility documentation
2. Review Edge Function logs via Supabase dashboard
3. Refer to [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
