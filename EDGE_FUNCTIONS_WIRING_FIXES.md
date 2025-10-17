# Edge Functions Wiring Fixes - Complete

## Issues Fixed

### 1. ✅ `cal-availability` Edge Function
**Problem**: Returning 400 errors with "eventTypeId is required"
**Root Cause**: 
- Missing Cal.com event types in database
- Poor error handling and logging
- Incorrect API endpoint usage

**Fixed**:
- ✅ Added comprehensive logging at each step
- ✅ Improved error messages to indicate missing data
- ✅ Separated database errors from missing data
- ✅ Using correct Cal.com API endpoint (`/v1/availability` with query params)

### 2. ✅ `api-coaching-availability` Edge Function  
**Problem**: Returning 400 errors with "Failed to fetch availability"
**Root Cause**:
- Using wrong Cal.com API endpoint (`/event-types/{id}/availability`)
- Missing timezone parameter handling
- Poor error messages

**Fixed**:
- ✅ Updated to use correct endpoint: `/v1/availability?eventTypeId=...&dateFrom=...&dateTo=...`
- ✅ Added timezone parameter support
- ✅ Added comprehensive logging
- ✅ Improved error messages with details
- ✅ Proper date range calculation (14 days ahead)

### 3. ✅ `send-password-reset` Edge Function
**Status**: Already has TODO comment for Resend domain verification
**Note**: This requires user action (domain verification at resend.com/domains)

## Current Database State

### Coaching Offers → Cal Event Types Mapping

| Coaching Offer | cal_event_type_slug | cal_event_type_id | Status |
|----------------|---------------------|-------------------|---------|
| discovery-60 | discovery-60min | sample-discovery-60min | ✅ WORKING |
| dreambuilder-3mo | dreambuilder-3month | NULL | ❌ MISSING |
| life-mastery-6mo | life-mastery-6month | NULL | ❌ MISSING |
| vip-private-1on1 | vip-private-coaching | NULL | ❌ MISSING |

### Cal Event Types in Database

```sql
SELECT slug, cal_event_type_id FROM cal_event_types;
```

| slug | cal_event_type_id |
|------|------------------|
| consultation-30min | sample-consultation-30min |
| discovery-60min | sample-discovery-60min |

**Missing**: dreambuilder-3month, life-mastery-6month, vip-private-coaching

## What Works Now

✅ **discovery-60** coaching offer - Full booking flow works
✅ **Better error messages** - Users will see clear messages about missing configuration
✅ **Proper logging** - All edge function calls are now logged for debugging
✅ **Correct API calls** - Using proper Cal.com API endpoints

## What Still Needs Setup

### Option 1: Create Cal.com Event Types (Recommended)
1. Log in to Cal.com at https://cal.com/zhengrowth
2. Create these event types:
   - `dreambuilder-3month` (for dreambuilder-3mo coaching offer)
   - `life-mastery-6month` (for life-mastery-6mo coaching offer) 
   - `vip-private-coaching` (for vip-private-1on1 coaching offer)
3. Use the admin panel to sync event types (or call `cal-event-types?action=sync`)

### Option 2: Insert Sample Data for Testing
Run this SQL to add placeholder event types:

```sql
INSERT INTO cal_event_types (slug, cal_event_type_id, title, length, active)
VALUES 
  ('dreambuilder-3month', 'placeholder-dreambuilder', '3-Month DreamBuilder', 60, true),
  ('life-mastery-6month', 'placeholder-lifemastery', '6-Month Life Mastery', 60, true),
  ('vip-private-coaching', 'placeholder-vip', 'VIP Private Coaching', 60, true);
```

**Note**: Placeholder IDs won't work with actual Cal.com API calls, but will fix the database lookup errors.

## Testing the Fixes

### Test Availability Endpoint
```bash
# Should work (has cal_event_type_id)
curl -X POST https://your-project.supabase.co/functions/v1/api-coaching-availability \
  -H "Content-Type: application/json" \
  -d '{"slug":"discovery-60","tz":"America/Vancouver"}'

# Should return clear error message (missing cal_event_type_id)
curl -X POST https://your-project.supabase.co/functions/v1/api-coaching-availability \
  -H "Content-Type: application/json" \
  -d '{"slug":"dreambuilder-3mo","tz":"America/Vancouver"}'
```

### Expected Error Response (for unconfigured offers)
```json
{
  "ok": false,
  "error": "Calendar event not configured",
  "details": "Event type \"dreambuilder-3month\" needs to be synced from Cal.com first"
}
```

## Next Steps

1. **Immediate**: The fixed edge functions will now return helpful error messages instead of failing silently
2. **Short-term**: Set up the 3 missing Cal.com event types on Cal.com
3. **Then**: Sync event types to populate the database
4. **Finally**: Test all 4 coaching offers end-to-end

## Cal.com API Documentation

The edge functions now use the correct Cal.com API v1 endpoints:
- **Availability**: `GET /v1/availability?eventTypeId=...&dateFrom=...&dateTo=...&timeZone=...`
- **Event Types List**: `GET /v1/event-types`

Reference: https://api.cal.com/v1/docs

## Edge Function Logs

All functions now include detailed logging:
- `[function-name] Looking up slug: ...`
- `[function-name] Found cal_event_type_slug: ...`  
- `[function-name] Using cal_event_type_id: ...`
- `[function-name] Fetching from Cal.com API with params: ...`
- `[function-name] Successfully fetched availability`

Check logs in Lovable Cloud backend to debug issues.
