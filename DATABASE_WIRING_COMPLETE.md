# Complete Database Wiring & Initial Data Documentation

## Overview
This document details all database tables, their relationships, initial data, and edge function connections for the complete system.

---

## 1. LEADS SYSTEM

### Table: `leads`
**Purpose**: Store and manage all incoming leads from various sources

**Columns**:
- `id` (uuid, primary key)
- `email` (text, required)
- `name` (text, required)
- `locale` (text) - migrated from `language`
- `source` (text) - signup, referral, quiz, webinar, ad:fb, ad:wechat
- `utm` (jsonb) - UTM parameters
- `stage` (text, default: 'new') - new, engaged, qualified, booked, won, lost
- `owner` (uuid) - references zg_profiles for lead assignment
- `profile_id` (uuid) - linked client profile if exists
- `notes` (jsonb, array) - structured notes with timestamps
- `clarity_score` (integer)
- `quiz_score` (integer)
- `quiz_answers` (jsonb)
- `tags` (text[])
- `country` (text)
- `wechat` (text)
- `booking_goal`, `booking_challenge`, `booking_timeline` (text)
- `created_at`, `updated_at` (timestamptz)

**Initial Data**: 10 diverse test leads with various stages

**Edge Functions**:
- `admin-leads-list` - GET list with filtering
- `admin-leads-upsert` - POST create/update
- `admin-leads-stage` - POST update stage
- `admin-leads-assign` - POST assign to owner
- `admin-leads-note` - POST add note
- `admin-leads-export-csv` - GET CSV export
- `api-admin-leads-list` - Existing analytics
- `api-admin-leads-analytics` - Existing analytics
- `api-admin-leads-update` - Existing update
- `api-admin-leads-export` - Existing export

**RLS Policies**:
- Admins can view/update/delete
- Anyone can insert (public forms)

**Indexes**:
- `leads_stage_owner` on (stage, owner)
- `leads_email` on (email)

---

## 2. BLOG SYSTEM

### Table: `blogs`
**Purpose**: Manage blog content with multi-language support and social media integration

**Columns**:
- `id` (uuid, primary key)
- `slug` (text, unique)
- `title` (text)
- `body_md` (text) - Markdown content
- `lang` (text, default: 'en')
- `published` (boolean)
- `published_at` (timestamptz)
- `social_posts` (jsonb) - Array of social media post records
- `created_at`, `updated_at` (timestamptz)

**Initial Data**: 3 published blog posts
1. "5 Steps to Finding Your Life Clarity" - published 7 days ago
2. "Building Unshakeable Confidence" - published 3 days ago
3. "Master the Art of Goal Setting" - published 1 day ago

**Edge Functions**:
- `admin-blog-upsert` - Create/update blog posts
- `admin-blog-list` - List all blogs (admin view)
- `admin-blog-delete` - Delete blog post
- `admin-sitemap-rebuild` - Rebuild sitemap with blog URLs

**RLS Policies**:
- Admins can manage all
- Anyone can view published posts

**Auto-Triggers**:
- `update_blogs_timestamp` - Updates `updated_at` and sets `published_at`

---

## 3. EVENTS CATALOG SYSTEM

### Table: `events_catalog`
**Purpose**: Manage event listings separate from the existing events system

**Columns**:
- `id` (uuid, primary key)
- `slug` (text, unique)
- `title` (text)
- `summary` (text)
- `starts_at`, `ends_at` (timestamptz)
- `calcom_event_type` (text) - Link to Cal.com
- `active` (boolean)
- `created_at`, `updated_at` (timestamptz)

**Initial Data**: 3 upcoming events
1. "Clarity Breakthrough Workshop" - 14 days from now
2. "Goal Mastery Intensive" - 21 days from now
3. "Confidence Builder Series" - 30 days from now

### Table: `event_prices`
**Purpose**: Multi-currency, region-specific pricing for events

**Columns**:
- `event_id` (uuid, FK to events_catalog)
- `currency` (text) - USD, CNY, HKD, SGD
- `amount_cents` (integer)
- `region` (text, nullable) - CN, HK, SG, etc.
- Primary key: (event_id, currency, region)

**Initial Data**: Complete pricing for all 3 events
- Clarity Workshop: $99 / ¥699 / HK$779 / SG$139
- Goal Intensive: $149 / ¥999 / HK$1169 / SG$199
- Confidence Series: $299 / ¥1999 / HK$2339 / SG$399

**Edge Functions**:
- `admin-events-upsert` - Create/update events
- `admin-events-list` - List all events
- `admin-events-tickets-price-test` - Update price variants for A/B testing

**RLS Policies**:
- Admins can manage all
- Anyone can view active events and prices

---

## 4. FEATURE FLAGS SYSTEM

### Table: `remote_flags`
**Purpose**: Remote configuration and feature toggles

**Columns**:
- `key` (text, primary key)
- `value` (jsonb)
- `updated_at` (timestamptz)

**Initial Data**: 5 feature flags
```json
{
  "enable_ab_testing": {"enabled": true, "description": "Master toggle for A/B testing"},
  "enable_ai_suggestions": {"enabled": true, "model": "gemini-2.5-flash"},
  "maintenance_mode": {"enabled": false, "message": "System maintenance"},
  "enable_social_sharing": {"enabled": true, "networks": ["linkedin", "facebook", "x"]},
  "enable_referral_program": {"enabled": true, "commission_percent": 20}
}
```

**Edge Functions**:
- `admin-flags-set` - POST update flag (admin only)
- `flags-get` - GET all flags (public)

**RLS Policies**:
- Admins can manage
- Anyone can read

---

## 5. I18N DICTIONARY SYSTEM

### Table: `i18n_dict`
**Purpose**: Manage translations for multi-language support

**Columns**:
- `lang` (text) - en, zh-CN, zh-TW, etc.
- `ns` (text) - namespace (app, coaching, events, etc.)
- `key` (text) - translation key
- `value` (text) - translated string
- Primary key: (lang, ns, key)

**Initial Data**: Core translations for 3 languages
- English (en): 8 keys
- Chinese Simplified (zh-CN): 8 keys
- Chinese Traditional (zh-TW): 8 keys

**Namespaces**:
- `app` - General app strings
- `coaching` - Coaching-related strings
- `events` - Event-related strings

**Edge Functions**:
- `admin-i18n-upsert` - POST add/update translation (admin)
- `i18n-get` - GET all translations for a language

**RLS Policies**:
- Admins can manage
- Anyone can read

---

## 6. EXPERIMENTS SYSTEM (Enhanced)

### Table: `experiments`
**Purpose**: A/B testing configuration

**Columns**:
- `key` (text, primary key)
- `variants` (text[]) - Legacy column
- `enabled` (boolean)
- `config` (jsonb) - Enhanced configuration
- `active` (boolean)
- `updated_at` (timestamptz)

**Existing Data Enhanced**:
- Pricing tests now have full config with variants, traffic, and metrics

**Related Tables**:
- `experiment_assignments` - Track user assignments

---

## 7. EXISTING SYSTEMS VERIFIED

### Coaching System
**Tables**: 
- `coaching_offers` - 3 active offers with Cal.com integration
- `coaching_pages` - Landing pages for offers
- `coaching_price_overrides` - Currency-specific pricing
- `coupon_redemptions` - Coupon usage tracking
- `coupons` - Active discount codes

**Wiring Status**: ✅ All offers linked to valid `cal_event_types`

### Cal.com Integration
**Tables**:
- `cal_event_types` - 3 event types (15min, 30min, 60min)
- `cal_bookings` - Webhook-synced bookings

**Admin Page**: `/admin/cal-event-types` - Manage Cal.com event types

### Lessons System
**Tables**:
- `lessons` - 4 published lessons
- `lesson_packages` - 1 active package ("starter-bundle")
- `lesson_assignments` - 4 lessons assigned to package
- `lesson_events` - User progress tracking
- `lesson_progress` - Completion tracking

**Wiring Status**: ✅ All lessons properly assigned

### Funnels System
**Tables**:
- `funnels` - 3 active funnels
- `lesson_funnel_triggers` - Triggers for funnel activation

**Initial Data**:
1. free-to-starter
2. starter-to-growth
3. growth-to-pro

---

## 8. CACHE & VERSION CONTROL

### Function: `bump_version(p_key text)`
**Purpose**: Invalidate caches by incrementing version numbers

**Usage**:
```sql
SELECT bump_version('content');  -- Invalidates content cache
```

**Edge Function**:
- `admin-cache-bust` - POST trigger cache invalidation

**Table**: `zg_versions`
- Tracks version numbers for cache busting

---

## 9. CROSS-SYSTEM INTEGRATIONS

### Blog → Social Media
- Blogs have `social_posts` jsonb field
- Track which posts have been shared where
- Future: Auto-posting via edge function

### Events → Cal.com
- `events_catalog.calcom_event_type` links to Cal.com
- Separate from `events` table used for existing system

### Leads → Profile Linking
- `leads.profile_id` can link to `zg_profiles`
- Enables conversion tracking from lead to customer

### Lessons → Funnels
- `lesson_funnel_triggers` activate funnels on lesson completion
- Drives upsell flow

---

## 10. ADMIN ACCESS PATTERNS

All admin functions verify via `requireAdmin()`:
1. Extracts JWT from Authorization header
2. Validates user exists
3. Checks `zg_admins` table for admin role
4. Returns `{ isAdmin: true, user }` or `{ isAdmin: false, user: null }`

**Security**:
- All admin edge functions use `verify_jwt = true`
- Public endpoints (`flags-get`, `i18n-get`) use `verify_jwt = false`

---

## 11. DATA INTEGRITY CHECKS

The system automatically verifies:

✅ **Coaching Offers → Cal.com Event Types**
- All active offers reference valid event types

✅ **Events → Pricing**
- All active events have at least one price configured

✅ **Leads → Valid Stages**
- Stage enum: new, engaged, qualified, booked, won, lost

✅ **Foreign Keys**
- All FKs properly reference parent tables
- Cascade deletes configured where appropriate

---

## 12. QUICK REFERENCE: TABLE COUNTS

| Table | Initial Rows | Purpose |
|-------|--------------|---------|
| blogs | 3 | Published blog content |
| events_catalog | 3 | Upcoming workshops/events |
| event_prices | 12 | Multi-currency pricing (3 events × 4 currencies) |
| remote_flags | 5 | Feature flags |
| i18n_dict | 24 | Translations (8 keys × 3 languages) |
| leads | 10+ | Lead management |
| coaching_offers | 3 | Active coaching programs |
| cal_event_types | 3 | Cal.com event types |
| lessons | 4 | Published lessons |
| funnels | 3 | Conversion funnels |

---

## 13. NEXT STEPS FOR EXPANSION

### Short-term:
- [ ] Add blog categories and tags
- [ ] Implement social media auto-posting
- [ ] Create event registration flow
- [ ] Add lead scoring automation

### Medium-term:
- [ ] Email campaign integration
- [ ] Advanced A/B testing UI
- [ ] Multi-language blog content
- [ ] Event capacity management

### Long-term:
- [ ] CRM integration
- [ ] Predictive lead scoring
- [ ] Automated nurture sequences
- [ ] Revenue analytics dashboard

---

## Status: ✅ COMPLETE

All database tables are properly wired with:
- ✅ Initial data populated
- ✅ Edge functions deployed
- ✅ RLS policies configured
- ✅ Foreign keys verified
- ✅ Indexes created
- ✅ Triggers active
- ✅ Admin authentication working
- ✅ Multi-currency support
- ✅ Multi-language support
