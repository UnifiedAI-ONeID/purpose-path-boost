# Redundancy & Disposition Map

## 1. Core Entities (Migrate & Consolidate)

| Supabase Table | Disposition | Target Firestore Path | Notes |
| :--- | :--- | :--- | :--- |
| **`zg_profiles`** | **Migrate** | `/users/{uid}` | Canonical profile data. Use Auth UID as key. |
| **`user_roles`** | **Consolidate** | `/users/{uid}` | Merge `role` field into user document. |
| **`coaching_offers`** | **Migrate** | `/products/coaching/{offerId}` | |
| **`events`** | **Migrate** | `/events/{eventId}` | |
| **`blog_posts`** | **Migrate** | `/blog_posts/{slug}` | Use slug as ID if unique, else UUID. |
| **`lessons`** | **Migrate** | `/lessons/{lessonId}` | |
| **`cal_bookings`** | **Migrate** | `/bookings/{bookingId}` | |
| **`cal_event_types`** | **Migrate** | `/config/calendar_types/{typeId}` | Configuration data. |
| **`event_regs`** | **Migrate** | `/registrations/{regId}` | Primary registration record. |
| **`event_tickets`** | **Consolidate** | `/registrations/{regId}` | Merge ticket details into registration doc if 1:1. |
| **`express_orders`** | **Migrate** | `/orders/{orderId}` | |
| **`me_goals`** | **Migrate** | `/users/{uid}/goals/{goalId}` | User-centric data. |
| **`me_sessions`** | **Migrate** | `/users/{uid}/sessions/{sessionId}` | User-centric data. |
| **`me_receipts`** | **Migrate** | `/users/{uid}/receipts/{receiptId}` | User-centric data. |
| **`nudge_inbox`** | **Migrate** | `/users/{uid}/notifications/{nudgeId}` | |
| **`leads`** | **Migrate** | `/leads/{leadId}` | |
| **`funnels`** | **Migrate** | `/config/funnels/{funnelId}` | |
| **`funnel_stages`** | **Consolidate** | `/config/funnels/{funnelId}` | Embed stages array in funnel doc. |
| **`user_funnel_progress`**| **Migrate** | `/users/{uid}/funnel_progress/{funnelId}` | |
| **`zg_referrals`** | **Migrate** | `/referrals/{referralId}` | |

## 2. System / Logs / Archive (Do Not Migrate)

| Supabase Table | Disposition | Notes |
| :--- | :--- | :--- |
| **`email_logs`** | **Archive** | Historical logs. Don't migrate to Firestore. |
| **`email_queue`** | **Drop** | Transient queue. Use Firebase Extensions. |
| **`email_templates`** | **Migrate** | `/config/email_templates/{templateId}` (Manual/Script) |
| **`email_attachments`** | **Archive** | |
| **`social_posts`** | **Evaluate** | If active, migrate to `/social_posts`. Else Archive. |
| **`social_metrics`** | **Archive** | Use new analytics solution. |
| **`analytics_events`** | **Archive** | High volume. Use GA4/BigQuery. |
| **`zg_versions`** | **Migrate** | `/config/system/version` | Single doc for version tracking. |
| **`v_funnel_weekly`** | **Ignore** | View. Rebuild logic in code. |
| **`v_tag_performance`** | **Ignore** | View. Rebuild logic in code. |

## 3. Field-Level Redundancy

- **User Roles**:
  - Source: `user_roles` table.
  - Target: `roles` array in `/users/{uid}`.
  - **Decision**: Drop `user_roles` table after merging.

- **Event Tickets vs Registrations**:
  - Source: `event_tickets` often links to `event_regs`.
  - Target: Single `registration` document containing ticket info.
  - **Decision**: Consolidate.

- **Funnel Stages**:
  - Source: `funnel_stages` (1:N with funnels).
  - Target: `stages` array inside `funnel` document.
  - **Decision**: Consolidate to reduce reads.
