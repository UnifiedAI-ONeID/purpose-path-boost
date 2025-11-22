# Supabase to Firebase Migration Report

## 1. Migration Status

| Phase | Status | Notes |
| :--- | :--- | :--- |
| **1. Discovery** | ✅ **Complete** | Inventory and disposition map created (`SUPABASE_INVENTORY.md`). |
| **2. Design** | ✅ **Complete** | Firestore schema designed (consolidated under `/users/{uid}` etc.). |
| **3. Tooling** | ✅ **Complete** | Migration engine in `tools/migration` is ready. |
| **4. Auth** | 🚧 **Ready** | `migrate_auth.ts` script ready. Reuse of Supabase UUIDs as Firebase UIDs is the strategy. |
| **5. Code Rewiring** | 🚧 **In Progress** | Critical paths (Dashboard, Blog, Events, Pricing) fully rewired. Admin panel rewired partially. |
| **6. Validation** | ⚠️ **Pending** | Requires full data migration run to validate counts. |

## 2. Data Migration Summary

| Entity | Source (Supabase) | Target (Firestore) | Status |
| :--- | :--- | :--- | :--- |
| **Users** | `zg_profiles` | `/users/{uid}` | Script Ready |
| **Roles** | `user_roles` | `/users/{uid}.roles` | Script Ready (Merged) |
| **Events** | `events` | `/events/{eventId}` | Script Ready |
| **Bookings** | `cal_bookings` | `/bookings/{bookingId}` | Script Ready |
| **Blog** | `blog_posts` | `/blog_posts/{slug}` | Script Ready |
| **Leads** | `leads` | `/leads/{leadId}` | Script Ready |

## 3. Application Code Status

The application has been patched to use Firestore (`src/firebase/config.ts`) for all critical user-facing features.

**Refactored Areas:**
*   Authentication (Login/Signup/Profile)
*   User Dashboard (`MeDashboard`)
*   Content Consumption (Blog, Lessons)
*   Public Pages (Pricing, Events)
*   Admin Overview (KPIs)

**Legacy Areas (Refactor Needed):**
*   Some deep Admin pages (`AdminAI`, `AdminSEO`) still call `supabase.functions.invoke`.
*   These are currently mocked in `src/db/index.ts` to prevent crashes.

## 4. Next Steps for Full Cutover

1.  **Secrets:** Obtain `SUPABASE_SERVICE_KEY` and `FIREBASE_SERVICE_ACCOUNT` JSON.
2.  **Execution:** Run `npm run migrate:all` in `tools/migration`.
3.  **Cloud Functions:** Deploy Firebase Functions to replace Supabase Edge Functions (mappings in `src/pages/admin/Overview.tsx`).
4.  **Cleanup:** Delete `src/db/index.ts` and uninstall `@supabase/supabase-js`.

## 5. Known Caveats

*   **Passwords:** Users will need to reset passwords via "Forgot Password" on Firebase Auth, as password hashes cannot be migrated easily.
*   **History:** `analytics_events` table in Supabase is not migrated (high volume). Use GA4 for future analytics.
