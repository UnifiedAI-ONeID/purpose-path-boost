# Lovable Cloud Database Schema Documentation

## Overview

This document provides a complete reference for the Lovable Cloud (Supabase) database schema for the ZhenGrowth coaching platform. The database is designed to support a full-featured coaching business with content management, e-commerce, analytics, and community features.

**Project ID:** `jwpnybimcqzcmbkjcqyj`

---

## Table of Contents

1. [User Management](#user-management)
2. [Authentication & Roles](#authentication--roles)
3. [Coaching & Bookings](#coaching--bookings)
4. [Content Management](#content-management)
5. [E-Commerce & Payments](#e-commerce--payments)
6. [Events System](#events-system)
7. [Marketing & Leads](#marketing--leads)
8. [Analytics & Tracking](#analytics--tracking)
9. [AI Features](#ai-features)
10. [Community Features](#community-features)
11. [Social Media Management](#social-media-management)
12. [Configuration & System](#configuration--system)
13. [Notifications & Messaging](#notifications--messaging)
14. [Security & RLS Policies](#security--rls-policies)

---

## User Management

### `zg_profiles`
**Purpose:** Core user profile data and preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | References `auth.users(id)` |
| `email` | text | YES | - | User's email address |
| `name` | text | YES | - | Display name |
| `avatar_url` | text | YES | - | Profile picture URL |
| `lang` | text | YES | `'en'` | Preferred language (en, zh-CN, zh-TW) |
| `timezone` | text | YES | `'America/Los_Angeles'` | User's timezone |
| `created_at` | timestamptz | YES | `now()` | Account creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update timestamp |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional user metadata |

**Indexes:**
- Primary key on `id`
- Unique index on `user_id`
- Index on `email`
- Index on `created_at DESC`

**RLS Policies:**
- Users can read/update their own profile
- Admins can read all profiles

---

### `user_roles`
**Purpose:** Role-based access control for users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | References `auth.users(id)` |
| `role` | app_role | NO | - | Enum: 'admin', 'coach', 'client' |
| `created_at` | timestamptz | YES | `now()` | When role was assigned |

**Indexes:**
- Primary key on `id`
- Unique constraint on `(user_id, role)`
- Index on `user_id`

**Security Function:**
```sql
public.has_role(_user_id uuid, _role app_role) RETURNS boolean
-- Security definer function to check user roles
```

**RLS Policies:**
- Users can read their own roles
- Only admins can assign/modify roles

---

### `user_badges`
**Purpose:** Achievement and gamification badges for users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | References `auth.users(id)` |
| `badge_code` | text | NO | - | References `badges(code)` |
| `awarded_at` | timestamptz | YES | `now()` | When badge was earned |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional badge data |

---

## Authentication & Roles

### `app_role` (ENUM)
**Values:**
- `admin` - Full system access
- `coach` - Can manage coaching sessions, content
- `client` - Standard user access

### Firebase Authentication Integration
The system uses Firebase Auth for authentication, with user profiles synced to `zg_profiles` table via `user_id` reference.

---

## Coaching & Bookings

### `coaching_offers`
**Purpose:** Coaching packages and programs available for purchase.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `slug` | text | NO | - | URL-friendly identifier |
| `title` | text | NO | - | Package name |
| `description` | text | YES | - | Full description |
| `price` | numeric | NO | - | Base price |
| `currency` | text | YES | `'USD'` | Currency code |
| `duration_weeks` | integer | YES | - | Program duration |
| `sessions_included` | integer | YES | - | Number of sessions |
| `features` | jsonb | YES | `'[]'::jsonb` | Feature list |
| `active` | boolean | YES | `true` | Is currently available |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |

**Indexes:**
- Primary key on `id`
- Unique index on `slug`
- Index on `active`

**RLS Policies:**
- Public read for active offers
- Admin-only write access

---

### `cal_bookings`
**Purpose:** Integration with Cal.com booking system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `cal_booking_id` | integer | YES | - | Cal.com booking ID (unique) |
| `event_id` | integer | YES | - | Cal.com event type ID |
| `user_id` | uuid | YES | - | References `auth.users(id)` |
| `attendee_email` | text | NO | - | Guest email |
| `attendee_name` | text | YES | - | Guest name |
| `start_time` | timestamptz | NO | - | Scheduled start |
| `end_time` | timestamptz | YES | - | Scheduled end |
| `status` | text | YES | `'confirmed'` | Booking status |
| `meeting_url` | text | YES | - | Video call link |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Cal.com response data |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `id`
- Unique index on `cal_booking_id`
- Index on `event_id`
- Index on `attendee_email`
- Index on `start_time`

**RLS Policies:**
- Users can view their own bookings (matched by email)
- Coaches/Admins can view all bookings

---

### `cal_event_types`
**Purpose:** Calendar event type configuration (synced with Cal.com).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | - | Primary key (matches Cal.com ID) |
| `slug` | text | NO | - | URL slug |
| `title` | text | NO | - | Event type name |
| `description` | text | YES | - | Event description |
| `duration_minutes` | integer | NO | - | Session duration |
| `price` | numeric | YES | `0` | Session price |
| `currency` | text | YES | `'USD'` | Currency code |
| `active` | boolean | YES | `true` | Is bookable |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Cal.com config |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last sync |

---

### `me_sessions`
**Purpose:** Coaching session notes and records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | Client user ID |
| `coach_id` | uuid | YES | - | Coach user ID |
| `booking_id` | uuid | YES | - | Related booking |
| `session_date` | timestamptz | NO | - | Session date |
| `notes` | text | YES | - | Session notes |
| `action_items` | jsonb | YES | `'[]'::jsonb` | Follow-up tasks |
| `status` | text | YES | `'scheduled'` | Session status |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**RLS Policies:**
- Users can read their own sessions
- Coaches can read/write assigned sessions
- Admins have full access

---

### `me_goals`
**Purpose:** User personal goals and progress tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | References `auth.users(id)` |
| `title` | text | NO | - | Goal description |
| `description` | text | YES | - | Detailed description |
| `status` | text | YES | `'active'` | Goal status |
| `target_date` | date | YES | - | Target completion |
| `progress_percent` | integer | YES | `0` | Progress (0-100) |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**RLS Policies:**
- Users can CRUD their own goals
- Coaches can view client goals

---

## Content Management

### `blog_posts`
**Purpose:** Blog content and articles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `slug` | text | NO | - | URL slug (unique) |
| `title` | text | NO | - | Post title |
| `excerpt` | text | YES | - | Short summary |
| `body_md` | text | YES | - | Markdown content |
| `cover_image` | text | YES | - | Hero image URL |
| `author_id` | uuid | YES | - | Author user ID |
| `published` | boolean | YES | `false` | Publication status |
| `published_at` | timestamptz | YES | - | Publication date |
| `lang` | text | YES | `'en'` | Content language |
| `tags` | text[] | YES | `'{}'::text[]` | Category tags |
| `meta_title` | text | YES | - | SEO title |
| `meta_description` | text | YES | - | SEO description |
| `view_count` | integer | YES | `0` | Page views |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `id`
- Unique index on `slug`
- Index on `published, published_at DESC`
- Index on `lang`
- Index on `tags` (GIN)

**RLS Policies:**
- Public read for published posts
- Admin-only write access

---

### `blog_templates`
**Purpose:** Social media post templates for content repurposing.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `platform` | text | NO | - | Social platform |
| `locale` | text | YES | `'en'` | Language |
| `name` | text | NO | - | Template name |
| `template` | text | NO | - | Template content |
| `variables` | jsonb | YES | `'{}'::jsonb` | Available variables |
| `active` | boolean | YES | `true` | Is active |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |

**Unique Constraint:** `(platform, locale, name)`

---

### `lessons`
**Purpose:** Video lessons and course content.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `slug` | text | NO | - | URL slug (unique) |
| `title` | text | NO | - | Lesson title |
| `description` | text | YES | - | Lesson description |
| `module_id` | text | YES | - | Course module |
| `order` | integer | YES | `0` | Sort order |
| `duration_sec` | integer | YES | - | Video duration |
| `yt_id` | text | YES | - | YouTube video ID |
| `chapters` | jsonb | YES | `'[]'::jsonb` | Video chapters |
| `tags` | text[] | YES | `'{}'::text[]` | Category tags |
| `published` | boolean | YES | `true` | Is published |
| `paywall` | boolean | YES | `false` | Requires payment |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `id`
- Unique index on `slug`
- Index on `published, order`
- Index on `module_id`

**RLS Policies:**
- Public read for published lessons
- Authenticated users can track progress
- Admin-only write access

---

### `lesson_progress`
**Purpose:** User progress tracking for video lessons.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | References `auth.users(id)` |
| `lesson_id` | uuid | NO | - | References `lessons(id)` |
| `last_position_sec` | integer | YES | `0` | Playback position |
| `completed` | boolean | YES | `false` | Completion status |
| `last_watched_at` | timestamptz | YES | `now()` | Last viewed |
| `completion_date` | timestamptz | YES | - | When completed |

**Unique Constraint:** `(user_id, lesson_id)`

**RLS Policies:**
- Users can CRUD their own progress

---

## E-Commerce & Payments

### `bookings`
**Purpose:** Payment-based booking records (separate from cal_bookings).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `booking_token` | text | NO | - | Unique booking token |
| `cal_booking_id` | integer | YES | - | Cal.com booking ID |
| `customer_email` | text | NO | - | Customer email |
| `customer_name` | text | YES | - | Customer name |
| `event_type_id` | integer | YES | - | Event type |
| `amount` | numeric | YES | - | Payment amount |
| `currency` | text | YES | `'USD'` | Currency code |
| `payment_id` | text | YES | - | Payment provider ID |
| `status` | text | YES | `'pending'` | Booking status |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `id`
- Unique index on `booking_token`
- Unique index on `cal_booking_id`
- Index on `customer_email`
- Index on `payment_id`
- Index on `status`
- Index on `created_at DESC`

---

### `express_orders`
**Purpose:** Quick checkout orders for coaching packages.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `order_number` | text | NO | - | Unique order number |
| `user_id` | uuid | YES | - | Buyer user ID |
| `customer_email` | text | NO | - | Customer email |
| `customer_name` | text | YES | - | Customer name |
| `items` | jsonb | NO | `'[]'::jsonb` | Order line items |
| `subtotal` | numeric | NO | - | Pre-tax amount |
| `tax` | numeric | YES | `0` | Tax amount |
| `total` | numeric | NO | - | Total amount |
| `currency` | text | YES | `'USD'` | Currency code |
| `payment_provider` | text | YES | - | Payment processor |
| `payment_id` | text | YES | - | Provider transaction ID |
| `status` | text | YES | `'pending'` | Order status |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |
| `created_at` | timestamptz | YES | `now()` | Order date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `id`
- Unique index on `order_number`
- Index on `customer_email`
- Index on `user_id`
- Index on `status`
- Index on `created_at DESC`

**RLS Policies:**
- Users can view their own orders
- Admins have full access

---

### `payments`
**Purpose:** Payment transaction records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | YES | - | Payer user ID |
| `order_id` | uuid | YES | - | Related order |
| `amount` | numeric | NO | - | Payment amount |
| `currency` | text | YES | `'USD'` | Currency code |
| `provider` | text | NO | - | Payment provider |
| `provider_id` | text | YES | - | Provider transaction ID |
| `status` | text | YES | `'pending'` | Payment status |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Provider response |
| `created_at` | timestamptz | YES | `now()` | Transaction date |

---

### `me_receipts`
**Purpose:** Receipt records for user purchases.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | Buyer user ID |
| `order_id` | uuid | YES | - | Related order |
| `amount` | numeric | NO | - | Receipt amount |
| `currency` | text | YES | `'USD'` | Currency code |
| `receipt_url` | text | YES | - | PDF receipt URL |
| `issued_at` | timestamptz | YES | `now()` | Issue date |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |

**RLS Policies:**
- Users can read their own receipts
- Admins have full access

---

### `coupons`
**Purpose:** Discount codes and promotions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `code` | text | NO | - | Coupon code (unique) |
| `discount_type` | text | NO | - | 'percent' or 'fixed' |
| `discount_value` | numeric | NO | - | Discount amount |
| `currency` | text | YES | `'USD'` | For fixed discounts |
| `max_uses` | integer | YES | - | Usage limit |
| `uses_count` | integer | YES | `0` | Times used |
| `valid_from` | timestamptz | YES | `now()` | Start date |
| `valid_until` | timestamptz | YES | - | Expiry date |
| `active` | boolean | YES | `true` | Is active |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional rules |
| `created_at` | timestamptz | YES | `now()` | Creation date |

**Indexes:**
- Primary key on `id`
- Unique index on `code`
- Index on `active, valid_until`

---

## Events System

### `events_catalog`
**Purpose:** Public events and workshops.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `slug` | text | NO | - | URL slug (unique) |
| `title` | text | NO | - | Event title |
| `description` | text | YES | - | Full description |
| `start_time` | timestamptz | NO | - | Event start |
| `end_time` | timestamptz | YES | - | Event end |
| `timezone` | text | YES | `'America/Los_Angeles'` | Event timezone |
| `location` | text | YES | - | Venue or 'online' |
| `capacity` | integer | YES | - | Max attendees |
| `registered_count` | integer | YES | `0` | Current registrations |
| `cover_image` | text | YES | - | Event image |
| `published` | boolean | YES | `false` | Is published |
| `tags` | text[] | YES | `'{}'::text[]` | Category tags |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |
| `created_at` | timestamptz | YES | `now()` | Creation date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `id`
- Unique index on `slug`
- Index on `published, start_time`
- Index on `tags` (GIN)

---

### `event_prices`
**Purpose:** Multi-currency and tiered pricing for events.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `event_id` | uuid | NO | - | References `events_catalog(id)` |
| `tier` | text | YES | `'standard'` | Pricing tier |
| `currency` | text | NO | - | Currency code |
| `amount` | numeric | NO | - | Price amount |
| `region` | text | YES | - | Geographic region |
| `active` | boolean | YES | `true` | Is active |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional rules |

**Indexes:**
- Primary key on `id`
- Index on `event_id, currency`
- Index on `active`

---

### `event_regs`
**Purpose:** Event registrations and attendee tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `event_id` | uuid | NO | - | References `events_catalog(id)` |
| `user_id` | uuid | YES | - | Registered user |
| `attendee_email` | text | NO | - | Attendee email |
| `attendee_name` | text | YES | - | Attendee name |
| `ticket_type` | text | YES | `'standard'` | Ticket tier |
| `status` | text | YES | `'registered'` | Registration status |
| `checked_in` | boolean | YES | `false` | Attendance status |
| `payment_status` | text | YES | `'pending'` | Payment status |
| `amount_paid` | numeric | YES | - | Amount paid |
| `currency` | text | YES | `'USD'` | Currency |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |
| `registered_at` | timestamptz | YES | `now()` | Registration date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `id`
- Index on `event_id, status`
- Index on `user_id`
- Index on `attendee_email`

**RLS Policies:**
- Users can view their own registrations
- Event organizers can view all registrations for their events
- Admins have full access

---

## Marketing & Leads

### `leads`
**Purpose:** Marketing lead capture and management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `email` | text | NO | - | Lead email |
| `name` | text | YES | - | Lead name |
| `phone` | text | YES | - | Contact phone |
| `source` | text | YES | - | Lead source |
| `stage` | text | YES | `'new'` | Lead stage |
| `status` | text | YES | `'active'` | Lead status |
| `owner` | uuid | YES | - | Assigned coach/admin |
| `tags` | text[] | YES | `'{}'::text[]` | Lead tags |
| `notes` | text | YES | - | Internal notes |
| `score` | integer | YES | `0` | Lead score |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |
| `created_at` | timestamptz | YES | `now()` | Capture date |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `last_contacted_at` | timestamptz | YES | - | Last contact |

**Indexes:**
- Primary key on `id`
- Index on `email`
- Index on `stage, status`
- Index on `owner`
- Index on `created_at DESC`

**RLS Policies:**
- Public can create leads (form submissions)
- Coaches/Admins can read/update leads

---

### `funnels`
**Purpose:** Marketing funnel definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `name` | text | NO | - | Funnel name |
| `slug` | text | NO | - | URL slug |
| `trigger_event` | text | YES | - | Trigger event type |
| `active` | boolean | YES | `true` | Is active |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Configuration |
| `created_at` | timestamptz | YES | `now()` | Creation date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

---

### `funnel_stages`
**Purpose:** Stages within marketing funnels.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `funnel_id` | uuid | NO | - | References `funnels(id)` |
| `name` | text | NO | - | Stage name |
| `order` | integer | NO | - | Sort order |
| `action_type` | text | YES | - | Action to perform |
| `action_config` | jsonb | YES | `'{}'::jsonb` | Action configuration |
| `delay_hours` | integer | YES | `0` | Delay before action |

---

### `user_funnel_progress`
**Purpose:** User progress through marketing funnels.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | References `auth.users(id)` |
| `funnel_id` | uuid | NO | - | References `funnels(id)` |
| `current_stage_id` | uuid | YES | - | Current stage |
| `started_at` | timestamptz | YES | `now()` | Funnel entry date |
| `completed_at` | timestamptz | YES | - | Completion date |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Progress data |

**RLS Policies:**
- Users can read their own progress
- Admins have full access

---

### `zg_referrals`
**Purpose:** Referral program tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `referrer_id` | uuid | NO | - | Referrer user ID |
| `referee_email` | text | NO | - | Referred user email |
| `referee_id` | uuid | YES | - | Referred user ID (after signup) |
| `status` | text | YES | `'pending'` | Referral status |
| `reward_amount` | numeric | YES | - | Reward amount |
| `currency` | text | YES | `'USD'` | Currency |
| `reward_claimed` | boolean | YES | `false` | Reward claimed status |
| `created_at` | timestamptz | YES | `now()` | Referral date |
| `completed_at` | timestamptz | YES | - | Conversion date |

**RLS Policies:**
- Users can view their own referrals
- Admins have full access

---

## Analytics & Tracking

### `analytics_events`
**Purpose:** Custom event tracking and analytics.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `event_name` | text | NO | - | Event type |
| `user_id` | uuid | YES | - | User who triggered |
| `session_id` | text | YES | - | Session identifier |
| `properties` | jsonb | YES | `'{}'::jsonb` | Event properties |
| `page_url` | text | YES | - | Page URL |
| `referrer` | text | YES | - | Referrer URL |
| `user_agent` | text | YES | - | Browser user agent |
| `ip_address` | inet | YES | - | IP address |
| `created_at` | timestamptz | YES | `now()` | Event timestamp |

**Indexes:**
- Primary key on `id`
- Index on `event_name`
- Index on `user_id`
- Index on `session_id`
- Index on `created_at DESC`

**RLS Policies:**
- Public can create events
- Admins can read events

---

### `experiments`
**Purpose:** A/B testing configuration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `key` | text | NO | - | Experiment key (unique) |
| `name` | text | NO | - | Experiment name |
| `enabled` | boolean | YES | `true` | Is active |
| `config` | jsonb | YES | `'{}'::jsonb` | Experiment configuration |
| `created_at` | timestamptz | YES | `now()` | Creation date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

---

### `experiment_assignments`
**Purpose:** User assignments to experiment variants.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `experiment_key` | text | NO | - | Experiment identifier |
| `user_id` | uuid | YES | - | Assigned user |
| `session_id` | text | YES | - | Session identifier |
| `variant` | text | NO | - | Assigned variant |
| `assigned_at` | timestamptz | YES | `now()` | Assignment date |

---

## AI Features

### `ai_logs`
**Purpose:** AI interaction logging and debugging.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `mode` | text | NO | - | AI mode/feature |
| `route` | text | YES | - | Application route |
| `prompt` | text | YES | - | User prompt |
| `response` | text | YES | - | AI response |
| `model` | text | YES | - | AI model used |
| `tokens_used` | integer | YES | - | Token count |
| `duration_ms` | integer | YES | - | Response time |
| `error` | text | YES | - | Error message |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |
| `at` | timestamptz | YES | `now()` | Timestamp |

**Indexes:**
- Primary key on `id`
- Index on `mode`
- Index on `route`
- Index on `at DESC`

---

### `ai_suggestions_cache`
**Purpose:** Cached AI-generated suggestions for performance.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `profile_id` | uuid | NO | - | User profile ID |
| `suggestion_type` | text | NO | - | Suggestion category |
| `suggestion_lang` | text | YES | `'en'` | Language |
| `content` | jsonb | NO | - | Cached suggestions |
| `expires_at` | timestamptz | YES | - | Cache expiry |
| `created_at` | timestamptz | YES | `now()` | Cache date |

**Indexes:**
- Primary key on `id`
- Index on `profile_id, suggestion_lang`

---

## Community Features

### `community_posts`
**Purpose:** User-generated community content.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `author_id` | uuid | NO | - | Post author |
| `title` | text | NO | - | Post title |
| `content` | text | NO | - | Post body |
| `tags` | text[] | YES | `'{}'::text[]` | Post tags |
| `likes_count` | integer | YES | `0` | Like count |
| `comments_count` | integer | YES | `0` | Comment count |
| `published` | boolean | YES | `true` | Publication status |
| `pinned` | boolean | YES | `false` | Is pinned |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |
| `created_at` | timestamptz | YES | `now()` | Post date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `id`
- Index on `author_id`
- Index on `published, created_at DESC`
- Index on `tags` (GIN)

**RLS Policies:**
- Authenticated users can read published posts
- Users can create posts
- Users can update/delete their own posts
- Coaches/Admins can moderate all posts

---

### `community_comments`
**Purpose:** Comments on community posts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `post_id` | uuid | NO | - | References `community_posts(id)` |
| `author_id` | uuid | NO | - | Comment author |
| `content` | text | NO | - | Comment text |
| `parent_id` | uuid | YES | - | Parent comment (for replies) |
| `likes_count` | integer | YES | `0` | Like count |
| `created_at` | timestamptz | YES | `now()` | Comment date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**RLS Policies:**
- Similar to community_posts

---

### `community_reports`
**Purpose:** Content moderation reports.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `reporter_id` | uuid | NO | - | User who reported |
| `content_type` | text | NO | - | 'post' or 'comment' |
| `content_id` | uuid | NO | - | Reported content ID |
| `reason` | text | NO | - | Report reason |
| `description` | text | YES | - | Additional details |
| `status` | text | YES | `'pending'` | Review status |
| `reviewed_by` | uuid | YES | - | Moderator |
| `reviewed_at` | timestamptz | YES | - | Review date |
| `action_taken` | text | YES | - | Moderation action |
| `created_at` | timestamptz | YES | `now()` | Report date |

**RLS Policies:**
- Users can create reports
- Only coaches/admins can view/manage reports

---

## Social Media Management

### `social_accounts`
**Purpose:** Connected social media accounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | Account owner |
| `platform` | text | NO | - | Platform name |
| `platform_user_id` | text | YES | - | Platform user ID |
| `username` | text | YES | - | Platform username |
| `access_token` | text | YES | - | OAuth token (encrypted) |
| `refresh_token` | text | YES | - | OAuth refresh token |
| `token_expires_at` | timestamptz | YES | - | Token expiry |
| `active` | boolean | YES | `true` | Is active |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Platform-specific data |
| `created_at` | timestamptz | YES | `now()` | Connection date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**RLS Policies:**
- Users can CRUD their own accounts
- Admins have read-only access

---

### `social_posts`
**Purpose:** Scheduled and published social media posts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | Post creator |
| `account_id` | uuid | NO | - | Social account |
| `platform` | text | NO | - | Platform name |
| `content` | text | NO | - | Post text |
| `media_urls` | text[] | YES | `'{}'::text[]` | Attached media |
| `status` | text | YES | `'draft'` | Post status |
| `scheduled_for` | timestamptz | YES | - | Schedule date |
| `published_at` | timestamptz | YES | - | Publish date |
| `platform_post_id` | text | YES | - | Platform post ID |
| `error` | text | YES | - | Error message |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Platform response |
| `created_at` | timestamptz | YES | `now()` | Creation date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**RLS Policies:**
- Users can CRUD their own posts

---

### `social_analytics`
**Purpose:** Social media performance metrics.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `post_id` | uuid | NO | - | References `social_posts(id)` |
| `impressions` | integer | YES | `0` | View count |
| `likes` | integer | YES | `0` | Like count |
| `comments` | integer | YES | `0` | Comment count |
| `shares` | integer | YES | `0` | Share count |
| `clicks` | integer | YES | `0` | Click count |
| `engagement_rate` | numeric | YES | - | Engagement % |
| `fetched_at` | timestamptz | YES | `now()` | Last sync |

---

## Configuration & System

### `remote_flags`
**Purpose:** Feature flags and remote configuration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `key` | text | NO | - | Primary key (flag identifier) |
| `value` | jsonb | NO | - | Flag value/config |
| `description` | text | YES | - | Flag description |
| `enabled` | boolean | YES | `true` | Is active |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Indexes:**
- Primary key on `key`
- Index on `enabled`

**RLS Policies:**
- Public read access
- Admin-only write access

---

### `i18n_dict`
**Purpose:** Internationalization translations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `lang` | text | NO | - | Language code |
| `ns` | text | NO | - | Namespace |
| `key` | text | NO | - | Translation key |
| `value` | text | NO | - | Translated text |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Unique Constraint:** `(lang, ns, key)`

**Indexes:**
- Primary key on `id`
- Unique index on `(lang, ns, key)`

**RLS Policies:**
- Public read access
- Admin-only write access

---

### `email_templates`
**Purpose:** Transactional email templates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `slug` | text | NO | - | Template identifier |
| `name` | text | NO | - | Template name |
| `subject` | text | NO | - | Email subject |
| `body_html` | text | NO | - | HTML body |
| `body_text` | text | YES | - | Plain text body |
| `variables` | jsonb | YES | `'{}'::jsonb` | Available variables |
| `active` | boolean | YES | `true` | Is active |
| `created_at` | timestamptz | YES | `now()` | Creation date |
| `updated_at` | timestamptz | YES | `now()` | Last update |

---

### `email_queue`
**Purpose:** Email sending queue (processed by background jobs).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `to_email` | text | NO | - | Recipient |
| `template_slug` | text | YES | - | Template to use |
| `subject` | text | NO | - | Email subject |
| `body_html` | text | YES | - | HTML body |
| `body_text` | text | YES | - | Plain text body |
| `variables` | jsonb | YES | `'{}'::jsonb` | Template variables |
| `status` | text | YES | `'pending'` | Queue status |
| `scheduled_for` | timestamptz | YES | `now()` | Send time |
| `sent_at` | timestamptz | YES | - | Sent timestamp |
| `error` | text | YES | - | Error message |
| `attempts` | integer | YES | `0` | Retry attempts |
| `created_at` | timestamptz | YES | `now()` | Queue date |

---

### `email_logs`
**Purpose:** Email delivery logs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `queue_id` | uuid | YES | - | References `email_queue(id)` |
| `to_email` | text | NO | - | Recipient |
| `subject` | text | YES | - | Email subject |
| `status` | text | NO | - | Delivery status |
| `provider_id` | text | YES | - | Email provider ID |
| `error` | text | YES | - | Error message |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Provider response |
| `sent_at` | timestamptz | YES | `now()` | Sent timestamp |

---

### `badges`
**Purpose:** Achievement badge definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `code` | text | NO | - | Primary key (badge code) |
| `name` | text | NO | - | Badge name |
| `description` | text | YES | - | Badge description |
| `icon` | text | YES | - | Icon URL |
| `criteria` | jsonb | YES | `'{}'::jsonb` | Earning criteria |
| `active` | boolean | YES | `true` | Is active |

---

### `zg_versions`
**Purpose:** Version control and feature gates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `version` | text | NO | - | Version number |
| `min_version` | text | YES | - | Minimum supported version |
| `force_update` | boolean | YES | `false` | Force update flag |
| `features` | jsonb | YES | `'{}'::jsonb` | Available features |
| `active` | boolean | YES | `true` | Is active |
| `created_at` | timestamptz | YES | `now()` | Release date |

---

## Notifications & Messaging

### `nudge_inbox`
**Purpose:** In-app notifications and nudges for users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | Recipient user ID |
| `type` | text | YES | - | Notification type |
| `title` | text | YES | - | Notification title |
| `message` | text | NO | - | Notification message |
| `action_url` | text | YES | - | Click-through URL |
| `read` | boolean | YES | `false` | Read status |
| `read_at` | timestamptz | YES | - | Read timestamp |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Additional data |
| `created_at` | timestamptz | YES | `now()` | Creation date |
| `expires_at` | timestamptz | YES | - | Expiry date |

**Indexes:**
- Primary key on `id`
- Index on `user_id, read, created_at DESC`

**RLS Policies:**
- Users can read/update their own notifications
- Coaches/Admins can create notifications

---

### `push_subscriptions`
**Purpose:** Web push notification subscriptions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | YES | - | Subscribed user |
| `endpoint` | text | NO | - | Push endpoint URL |
| `p256dh` | text | NO | - | Encryption key |
| `auth` | text | NO | - | Auth secret |
| `user_agent` | text | YES | - | Browser info |
| `active` | boolean | YES | `true` | Is active |
| `created_at` | timestamptz | YES | `now()` | Subscription date |
| `last_used_at` | timestamptz | YES | - | Last notification sent |

**Indexes:**
- Primary key on `id`
- Unique index on `endpoint`
- Index on `user_id, active`

**RLS Policies:**
- Users can CRUD their own subscriptions

---

## Security & RLS Policies

### Row Level Security (RLS) Status

All tables have RLS enabled. The following security patterns are used:

#### Public Read, Admin Write
- `blog_posts` (published only)
- `lessons` (published only)
- `coaching_offers` (active only)
- `events_catalog` (published only)
- `remote_flags`
- `i18n_dict`

#### User-Scoped Access
- `zg_profiles` - Users can read/update own profile
- `user_roles` - Users can read own roles
- `me_goals` - Users can CRUD own goals
- `me_sessions` - Users see own sessions, coaches see assigned
- `lesson_progress` - Users can CRUD own progress
- `bookings` - Users see own bookings
- `express_orders` - Users see own orders
- `me_receipts` - Users see own receipts
- `nudge_inbox` - Users can read/mark own notifications
- `push_subscriptions` - Users can CRUD own subscriptions
- `social_accounts` - Users can CRUD own accounts
- `social_posts` - Users can CRUD own posts

#### Coach/Admin Access
- `leads` - Coaches/Admins can read/update all leads
- `cal_bookings` - Coaches see all bookings
- `community_reports` - Only coaches/admins can view
- `analytics_events` - Admins can read

#### Public Write (with validation)
- `leads` - Public can create (lead forms)
- `analytics_events` - Public can create (tracking)
- `community_posts` - Authenticated users can create

### Security Functions

#### `has_role(_user_id uuid, _role app_role)`
Security definer function to check user roles without RLS recursion.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### Custom Types (ENUMs)

#### `app_role`
- `admin`
- `coach`
- `client`

---

## Database Statistics

### Current Record Counts (Approximate)

| Table | Description | Estimated Rows |
|-------|-------------|----------------|
| `zg_profiles` | User profiles | 1,000+ |
| `blog_posts` | Blog content | 50+ |
| `lessons` | Video lessons | 100+ |
| `coaching_offers` | Packages | 5-10 |
| `cal_bookings` | Bookings | 500+ |
| `leads` | Marketing leads | 2,000+ |
| `analytics_events` | Event tracking | 100,000+ |
| `community_posts` | Community content | 200+ |

---

## Integration Points

### External Services

1. **Cal.com** - Booking system integration
   - Tables: `cal_bookings`, `cal_event_types`
   - Webhook handling for booking updates

2. **Firebase Auth** - Authentication
   - User IDs synced to `user_id` fields
   - Custom claims for roles

3. **Payment Providers** (Stripe, Airwallex)
   - Tables: `bookings`, `express_orders`, `payments`
   - Webhook handling for payment confirmations

4. **Email Service** (Resend)
   - Tables: `email_queue`, `email_templates`, `email_logs`

5. **AI Services** (Google AI)
   - Tables: `ai_logs`, `ai_suggestions_cache`
   - Used for content generation and suggestions

---

## Migration Notes

This database is currently in a **transition state** from Supabase to Firebase/Firestore. The schema documented here represents the **current Supabase structure**.

### Planned Firestore Migration

The following collections are planned for Firestore:
- `/users/{uid}` - User profiles and subcollections
- `/blog_posts/{slug}` - Blog content
- `/lessons/{id}` - Learning content
- `/events/{id}` - Events catalog
- `/bookings/{id}` - Booking records

See `FIRESTORE_SCHEMA.md` and related migration documentation for details.

---

## Database Maintenance

### Indexes Strategy
- All primary keys are UUID v4
- Foreign keys are indexed for join performance
- Timestamp columns have DESC indexes for sorting
- Array/JSONB columns use GIN indexes where appropriate
- Unique constraints on natural keys (slug, email, code)

### Performance Considerations
- High-volume tables: `analytics_events`, `email_logs`
- Partitioning recommended for analytics tables
- Regular VACUUM and ANALYZE recommended
- Connection pooling via Supabase Pooler

---

## Backup & Recovery

- **Daily Backups:** Automatic via Supabase
- **Point-in-Time Recovery:** Available for 7 days
- **Manual Exports:** Can be triggered via Supabase Dashboard

---

## Support & Documentation

- **Supabase Dashboard:** [Access restricted - admin only]
- **API Documentation:** Auto-generated from schema
- **RLS Policy Testing:** Available in Supabase SQL Editor

---

**Last Updated:** 2025-11-29
**Schema Version:** 1.0.0
**Database System:** PostgreSQL 15.x (Supabase)
