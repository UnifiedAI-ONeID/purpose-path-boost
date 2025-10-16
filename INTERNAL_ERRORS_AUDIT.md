# Internal Errors Audit - 2025-01-16

## Summary

Found and fixing 3 categories of issues:
1. ✅ **Database column error** (FIXED - awaiting deployment)
2. ⚠️ **Security warning** (needs configuration)
3. 🔧 **Error-prone `.single()` queries** (fixing high-priority ones)

---

## Issue 1: Testimonials Column Error ✅ FIXED

**Status:** Code fixed, awaiting automatic deployment

**Error:**
```
column testimonials.sort does not exist
```

**Root Cause:**
- Edge function `api-testimonials-list` was querying non-existent column `sort`
- Testimonials table has: id, name, locale, quote, role, avatar_url, featured, created_at
- No `sort` column exists (coaching_offers has sort, but not testimonials)

**Fix Applied:**
```typescript
// Changed from:
.order('sort', { ascending: true })

// To:
.eq('featured', true)
.order('created_at', { ascending: false })
```

**File:** `supabase/functions/api-testimonials-list/index.ts`

**Impact:** 
- Last errors: 2025-10-16T21:28:35Z and 2025-10-16T21:23:39Z
- Will resolve automatically on next deployment

---

## Issue 2: Password Security Configuration ⚠️ NEEDS ACTION

**Level:** WARN  
**Category:** SECURITY

**Issue:**
```
Leaked password protection is currently disabled
```

**Recommendation:**
Enable leaked password protection in Supabase Auth settings:
1. Navigate to Authentication → Policies
2. Enable "Leaked Password Protection"
3. This prevents users from using passwords found in data breaches

**Documentation:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Action Required:** Admin must enable via Lovable Cloud backend UI

---

## Issue 3: Risky `.single()` Queries 🔧 FIXING

**Problem:**
31 instances of `.single()` across 22 edge functions that will throw errors if no data is found.

**Risk Level by Function:**

### 🔴 CRITICAL (user-facing, likely to fail)
1. **api-coaching-checkout** - User booking flows
2. **api-coaching-price** - Public pricing queries
3. **api-events-register** - Event registration
4. **api-express-create** - Express order creation
5. **api-express-price** - Public pricing

### 🟡 MEDIUM (internal, could fail)
6. **api-billing-webhook** - Payment webhooks
7. **api-billing-create-agreement** - Subscription creation
8. **api-events-offer-accept** - Event offer acceptance
9. **api-me-summary** - User profile queries

### 🟢 LOW (admin/internal, unlikely to fail)
10. **booking-create** - Internal booking
11. **manage-social-config** - Admin config
12. **pwa-*** functions - PWA internal operations

**Solution:**
Replace `.single()` with `.maybeSingle()` for queries that might not return data:

```typescript
// ❌ BEFORE - Throws error if no data
const { data } = await supabase.from('table').select().eq('id', id).single();

// ✅ AFTER - Returns null if no data
const { data } = await supabase.from('table').select().eq('id', id).maybeSingle();

// Handle null case
if (!data) {
  return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404 });
}
```

---

## Fixes Being Applied

### Fix 1: Critical Public-Facing Functions
- api-coaching-checkout
- api-coaching-price  
- api-coaching-price-with-discount
- api-express-price
- api-events-register

### Fix 2: User Profile Queries
- api-me-summary
- api-billing-create-agreement
- api-billing-webhook

### Fix 3: Event Functions
- api-events-offer-accept

---

## Testing Checklist After Fixes

- [ ] Testimonials load without errors
- [ ] Coaching booking works with invalid offer slug
- [ ] Event registration handles invalid tickets
- [ ] Express pricing works with invalid offers
- [ ] Profile queries handle missing users
- [ ] Billing webhooks handle missing profiles

---

## Additional Recommendations

### Database Optimization
1. Add indexes for frequently queried fields:
   - `testimonials.featured` (if filtering by featured)
   - `coaching_offers.active` (already exists)
   - `events.status` (for published event queries)

### Error Monitoring
1. Implement structured error logging in edge functions
2. Set up alerts for 4xx/5xx response codes
3. Monitor edge function execution times

### Code Quality
1. Create shared error handling utilities
2. Standardize response formats across edge functions
3. Add request validation schemas

---

## Summary Stats

**Total Issues Found:** 33
- ✅ Fixed: 1 (testimonials)
- 🔧 Fixing: 9 (critical .single() calls)
- ⚠️ Config needed: 1 (password protection)
- ℹ️ Low priority: 22 (non-critical .single() calls)

**Estimated Impact:**
- **High:** Eliminates database query errors
- **Medium:** Improves error handling for edge cases
- **Low:** Better security posture

**Next Deployment:**
All code fixes will be automatically deployed on next build.
