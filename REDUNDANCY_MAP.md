# Redundancy & Migration Map

## 1. Consolidated Collections

| Source Table(s) | Target Firestore Path | Merge Strategy |
| :--- | :--- | :--- |
| `zg_profiles`, `user_roles` | `/users/{uid}` | Merge `role` from `user_roles` into profile doc. Use Firebase Auth `uid` as doc ID. |
| `me_goals` | `/users/{uid}/goals/{goalId}` | Subcollection of user. |
| `me_sessions` | `/users/{uid}/sessions/{sessionId}` | Subcollection of user. |
| `me_receipts` | `/users/{uid}/receipts/{receiptId}` | Subcollection of user. |
| `nudge_inbox` | `/users/{uid}/notifications/{nudgeId}` | Subcollection of user. |
| `user_funnel_progress` | `/users/{uid}/funnel_progress/{progressId}` | Subcollection of user. |
| `event_regs`, `event_tickets` | `/events/{eventId}/registrations/{regId}` | Consolidate tickets/regs into a subcollection of the event (or root `/registrations` if querying by user is more frequent). |

## 2. Direct Migrations

| Source Table | Target Firestore Path | Notes |
| :--- | :--- | :--- |
| `blog_posts` | `/blog_posts/{id}` | Keep slugs for SEO. |
| `events` | `/events/{id}` | |
| `coaching_offers` | `/products/{id}` | Renamed to generic `products` or keep `coaching_offers`. |
| `lessons` | `/lessons/{id}` | |
| `cal_bookings` | `/bookings/{id}` | |
| `express_orders` | `/orders/{id}` | |
| `leads` | `/leads/{id}` | |
| `zg_referrals` | `/referrals/{id}` | |
| `email_templates` | `/config/email/templates/{id}` | |
| `funnels` | `/config/funnels/{id}` | |
| `cal_event_types` | `/config/calendar/types/{id}` | |

## 3. Archived / Dropped (Not Migrating)

| Source Table | Disposition | Reason |
| :--- | :--- | :--- |
| `analytics_events` | DROP / ARCHIVE | High volume, use GA4 going forward. |
| `email_logs` | DROP | Ephemeral log data. |
| `email_queue` | DROP | Processed state. |
| `email_attachments` | DROP | Likely blob storage references; handle via Storage if needed. |
| `v_*` (Views) | DROP | Reimplement as code/queries. |

## 4. Field-Level Redundancy Removal

- **User Profile**:
  - `zg_profiles` is the single source of truth for `name`, `email`, `avatar_url`.
  - Remove these fields from `cal_bookings` or `orders` if they are just snapshots (unless snapshot is required for invoice immutability).
  - **Decision**: Keep snapshot data in `orders` for legal reasons. Remove from `me_sessions` if just for display (fetch from profile).

## 5. ID Mapping Strategy

- **Users**:
  - If we can migrate Supabase Auth UIDs to Firebase Auth UIDs 1:1, great.
  - If not, we need a mapping `supabase_uid` -> `firebase_uid`.
  - **Plan**: Store `supabase_id` field in `/users/{uid}` doc for reference.

- **Other Entities**:
  - Reuse Supabase UUIDs as Firestore Document IDs to preserve relationships.
