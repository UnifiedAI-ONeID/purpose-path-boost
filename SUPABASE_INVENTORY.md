# Supabase Inventory & Migration Analysis

## 1. Core Entities (Must Migrate)

These tables are critical for the application's operation and must be migrated to Firestore.

### User & Profile Management
- **`zg_profiles`** (Profiles)
  - **Usage**: User profiles, linked to auth.
  - **Migration**: Map to `/users/{uid}` collection.
  - **Critical Fields**: `id` (auth uid), `email`, `full_name`, `avatar_url`, `role`.
- **`user_roles`** (Roles)
  - **Usage**: Role-based access control.
  - **Migration**: Merge into `/users/{uid}` as a `roles` array or field.

### Content & Marketing
- **`blog_posts`** (Blog)
  - **Usage**: Public blog posts.
  - **Migration**: `/blog_posts/{slug}` or `/content/blog/{postId}`.
- **`coaching_offers`** (Coaching)
  - **Usage**: Available coaching programs.
  - **Migration**: `/products/coaching/{offerId}`.
- **`events`** (Events)
  - **Usage**: Public events.
  - **Migration**: `/events/{eventId}`.
- **`lessons`** (Lessons)
  - **Usage**: Educational content.
  - **Migration**: `/lessons/{lessonId}`.

### Commerce & Bookings
- **`cal_bookings`** (Bookings)
  - **Usage**: Calendar bookings.
  - **Migration**: `/bookings/{bookingId}`.
- **`cal_event_types`** (Event Types)
  - **Usage**: Types of bookable events.
  - **Migration**: `/config/calendar/types/{typeId}`.
- **`event_regs`** / **`event_tickets`** (Event Registrations)
  - **Usage**: User registrations for events.
  - **Migration**: Subcollection `/events/{eventId}/registrations/{regId}` or top-level `/registrations/{regId}`.
- **`express_orders`** (Orders)
  - **Usage**: Quick checkout orders.
  - **Migration**: `/orders/{orderId}`.

### User Progress & Engagement
- **`me_goals`** (Goals)
  - **Usage**: User personal goals.
  - **Migration**: `/users/{uid}/goals/{goalId}`.
- **`me_sessions`** (Sessions)
  - **Usage**: Coaching sessions.
  - **Migration**: `/users/{uid}/sessions/{sessionId}`.
- **`me_receipts`** (Receipts)
  - **Usage**: Transaction history.
  - **Migration**: `/users/{uid}/receipts/{receiptId}`.
- **`nudge_inbox`** (Notifications)
  - **Usage**: In-app notifications.
  - **Migration**: `/users/{uid}/notifications/{nudgeId}`.

### Funnels & Leads
- **`leads`** (Leads)
  - **Usage**: Captured leads.
  - **Migration**: `/leads/{leadId}`.
- **`funnels`** / **`funnel_stages`** (Funnels)
  - **Usage**: Marketing funnels structure.
  - **Migration**: `/config/funnels/{funnelId}`.
- **`user_funnel_progress`** (Funnel Progress)
  - **Usage**: Tracking user movement in funnels.
  - **Migration**: `/users/{uid}/funnel_progress/{funnelId}`.
- **`zg_referrals`** (Referrals)
  - **Usage**: Referral system.
  - **Migration**: `/referrals/{referralId}`.

## 2. Secondary / System Entities (Evaluate)

These might be migrated or replaced by Firebase native features or Cloud Functions.

- **`email_logs`, `email_queue`, `email_templates`, `email_attachments`**
  - **Recommendation**: Replace with Firebase Extensions (Trigger Email) or custom Cloud Functions. Migrate templates to Firestore `/config/email_templates`.
- **`social_posts`, `social_metrics`**
  - **Recommendation**: Migrate to `/social/posts` and `/social/metrics` if this feature is active.
- **`analytics_events`**
  - **Recommendation**: Switch to Google Analytics 4 (GA4) for future data. Archive old data if needed, but don't migrate to Firestore (too expensive/high volume).
- **`zg_versions`**
  - **Recommendation**: `/config/system/version`.

## 3. Views (Do Not Migrate Directly)

- **`v_funnel_weekly`**
- **`v_tag_performance`**
- **Strategy**: Recreate logic using Firestore aggregations or Cloud Functions triggers to update summary documents.

## 4. Relationships & Schema Considerations

- **User-Centric Data**: Most data is owned by a user. Subcollections under `/users/{uid}` are highly recommended for `goals`, `sessions`, `notifications`.
- **Public Content**: `blog_posts`, `events`, `coaching_offers` are read-heavy, public-facing.
- **IDs**:
  - Use Supabase `id` (UUID) as Firestore Document ID where possible to preserve links.
  - For Users: Firebase Auth `uid` will be the key. We need a mapping strategy if Supabase `id` != Firebase `uid`.

## 5. Community Features (Future Dependency)

The upcoming Community features will likely depend on:
- **Users**: Profiles (name, avatar, role).
- **Content**: Access to lessons/events based on role/purchase.
- **Social**: Although not currently in Supabase, new collections for posts/comments will link to `users`.
