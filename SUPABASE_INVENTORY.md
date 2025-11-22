You are my senior data architect and Firebase expert.

Context:
- We no longer have live access to Supabase.
- We DO have a schema snapshot & notes in:
  /mnt/data/SUPABASE_INVENTORY.md
- Target platform: Firebase (Firestore, Firebase Auth) in project:
  zhengrowth-71805517-6aa3a
- Frontend: React + Vite app (ZhenGrowth / purpose-path-boost)
- Backend: Node/TS on Cloud Run (but your focus here is the DATA MODEL).

Goal:
Using ONLY the information from SUPABASE_INVENTORY.md and any hints from typical SaaS/coaching schemas, RECREATE the database structure in Firestore:

- Design a canonical **Firestore schema** (collections, subcollections, fields).
- Define **types, relationships, and indexes**.
- Generate **Firestore security rules** that match the intended access patterns.
- Produce a **JSON/YAML schema manifest** for the Firestore model.
- Provide hooks/plans for future data import (CSV, manual backfill, etc.).

We are NOT migrating live data right now; we are reconstructing the schema and access layer so the app can run purely on Firestore and we can import data later.

=====================================================================
PHASE 1 – UNDERSTAND THE SUPABASE INVENTORY
=====================================================================

Tasks:

1. Parse /mnt/data/SUPABASE_INVENTORY.md
   - Extract ALL tables and their columns:
     - Table name
     - Column name, type, nullability, default, constraints
     - Foreign keys & relationships (if documented)
   - Group tables into functional domains, such as:
     - Auth / profiles / users
     - Programs / offers / courses
     - Events / bookings / schedules
     - Orders / payments / invoices
     - Leads / funnels / referrals
     - Learning content / lessons / progress
     - Analytics / logs / email queues
     - Misc / legacy / test

2. For each table, note:
   - What the table appears to represent in business terms.
   - How it relates to other tables (FKs, naming, etc.).

3. Produce a concise “Supabase Schema Overview”:
   - List each table with:
     - short description
     - key columns
     - main relationship(s)

If you cannot infer what a table does from the markdown alone, say so explicitly and ask me a clarifying question instead of guessing wildly.

=====================================================================
PHASE 2 – CANONICAL FIRESTORE MODEL DESIGN
=====================================================================

Goal:
Design a clean Firestore schema that captures the same concepts as Supabase, but in a document/collection style optimized for ZhenGrowth.

Tasks:

2.1 Define core top-level collections
   - Based on the inventory, propose top-level collections such as (examples):
     - `/users/{uid}`
     - `/programs/{programId}` or `/coaching_offers/{offerId}`
     - `/events/{eventId}`
     - `/bookings/{bookingId}`
     - `/orders/{orderId}`
     - `/lessons/{lessonId}`
     - `/leads/{leadId}`
     - `/referrals/{referralId}`
     - `/content/{contentId}` or `/blog_posts/{postId}`
   - For each, specify:
     - Fields and types
     - Which Supabase tables/columns they come from conceptually

2.2 Define user-centric subcollections
   - Under `/users/{uid}`, propose subcollections such as:
     - `/goals/{goalId}`
     - `/sessions/{sessionId}` (coaching sessions)
     - `/receipts/{receiptId}`
     - `/notifications/{notificationId}`
     - `/progress/{progressId}` (learning progress)
   - Map these to the appropriate Supabase tables/columns.

2.3 Define config/meta collections
   - For example:
     - `/config/funnels/{funnelId}`
     - `/config/calendar/types/{typeId}`
     - `/config/email_templates/{templateId}`
     - `/config/community_guidelines`
   - These replace Supabase lookup / config tables.

2.4 Relationships & denormalization
   - For each relationship identified in Supabase:
     - Decide how it should be represented in Firestore, e.g.:
       - A reference by ID (e.g. `userId`, `programId`, `eventId`)
       - A denormalized subset of fields (e.g. user displayName inside a booking)
   - Make explicit where you recommend denormalization for performance and where you prefer pure references.

2.5 Firestore Schema Manifest
   - Produce a machine-readable manifest (JSON or YAML) with entries like:

     - collectionPath: "/bookings"
       docId: "bookingId"
       fields:
         userId: string
         eventId: string
         status: "pending" | "confirmed" | "cancelled"
         createdAt: timestamp
         ...
       fromSupabaseTables: ["bookings", "events_users_link", ...]

   - Do this for each core collection/subcollection.

If at any point the inventory is ambiguous, propose the most likely mapping and clearly mark it as an assumption so I can correct you.

=====================================================================
PHASE 3 – INDEXES & QUERY PATTERNS
=====================================================================

Goal:
Define indexes based on likely query patterns from the Supabase era and typical coaching SaaS needs.

Tasks:

3.1 Infer query patterns
   - From table/column names and relationships, infer common queries, such as:
     - “Bookings by user, ordered by date”
     - “Upcoming events”
     - “Active programs for a user”
     - “Leads by status and source”
   - Write out these queries in pseudo-code using the Firestore model.

3.2 Define required Firestore indexes
   - For each query pattern that needs composite indexes (e.g. where + orderBy), specify:
     - Collection
     - Fields
     - Order (asc/desc)
   - Output an `indexes.json`-style snippet or a list of index definitions that can be pasted into Firebase’s index configuration.

=====================================================================
PHASE 4 – FIRESTORE SECURITY RULES
=====================================================================

Goal:
Create a first pass of Firestore security rules that align with the reconstructed data model and probable Supabase RLS intent.

Tasks:

4.1 Roles & identity
   - Assume roles are stored in `/users/{uid}.roles` as an array of strings:
     - "client"
     - "coach"
     - "admin"
   - Assume `request.auth.uid` is the Firebase Auth user ID.

4.2 Rules per collection
   - For `/users/{uid}`:
     - Only the user can read/write their own doc.
     - Admins can read/update fields as needed.
   - For `/users/{uid}/goals`, `/sessions`, `/progress`, `/receipts`, `/notifications`:
     - Owner-only read/write.
     - Admin/coaches may have read-only for coaching-related data where appropriate; call this out and propose a rule.
   - For `/bookings`:
     - Clients can read bookings where `booking.userId == request.auth.uid`.
     - Admins/coaches can read and manage all bookings.
   - For `/events`, `/programs`, `/lessons`:
     - Read allowed to authenticated users (or public, if appropriate).
     - Writes restricted to admins/coaches.
   - For `/leads`, `/referrals`:
     - Likely admin-only (or coach+admin).
   - Any additional collections from the schema manifest should have sensible access defaults; explain your choices.

4.3 Emulator-friendly rules
   - Output an example `firestore.rules` file that:
     - Defines helper functions (e.g. `isSignedIn()`, `isOwner(userId)`, `hasRole(role)`).
     - Uses these helpers in collection-level rules.

4.4 Call out any unknowns
   - If access patterns for a specific collection are unclear, explicitly ask me:
     - “Should leads be visible to all coaches or only admins?” etc.

=====================================================================
PHASE 5 – BACKFILL & IMPORT STRATEGY (WITHOUT LIVE SUPABASE)
=====================================================================

Goal:
Since we don’t have live access to Supabase anymore, define how to populate Firestore with data in the future (from CSV exports, manual entry, or other backups).

Tasks:

5.1 Map required fields for import
   - For each core collection:
     - Identify the minimum set of fields required to be useful in the app.
   - Provide a simple CSV/JSON template schema, e.g.:
     - For `/users`:
       - `uid, email, displayName, roles, createdAt, ...`
     - For `/bookings`:
       - `bookingId, userId, eventId, status, scheduledAt, ...`

5.2 Node/TS import script stubs
   - Generate high-level examples for Node/TypeScript scripts:
     - `import_users_from_csv.ts`
     - `import_bookings_from_csv.ts`
   - Each script should:
     - Read CSV/JSON from a local file.
     - Map columns to Firestore doc fields according to the manifest.
     - Use batch writes or BulkWriter for performance.
     - Be idempotent (use consistent doc IDs, `set`/`merge`).

5.3 Missing data strategy
   - Suggest strategies when imported data is incomplete:
     - Example: missing `userId` references, unknown roles, etc.
   - Clearly mark such records so they can be manually cleaned later (e.g. under `/admin/data_anomalies`).

=====================================================================
PHASE 6 – APP INTEGRATION GUIDANCE (READ/WRITE PATTERNS)
=====================================================================

Goal:
Provide guidance for frontend/back-end developers on how to use the new Firestore schema instead of Supabase.

Tasks:

6.1 Service layer patterns
   - Suggest how to structure service modules, e.g.:
     - `src/services/users.ts`
     - `src/services/bookings.ts`
     - `src/services/leads.ts`
   - For each, show example Firestore queries and mutations:
     - `getUserById(uid)`
     - `listBookingsForUser(uid)`
     - `createBooking(data)`
     - `updateGoal(userId, goalId, updates)`

6.2 Common Firestore pitfalls
   - Highlight:
     - Cost of unbounded queries.
     - Need for proper indexes.
     - Denormalization trade-offs.
   - Provide recommendations to avoid anti-patterns (e.g., massive fan-out writes, unbounded collection scans).

6.3 TypeScript types
   - Define example TS interfaces/types that match the Firestore schema.
   - Show how they can be used with Firestore (`withConverter` pattern) if desired.

=====================================================================
PHASE 7 – FINAL “RECONSTRUCTED DB” SUMMARY
=====================================================================

Goal:
Produce a clear, human-readable summary of the reconstructed Firestore DB that can serve as documentation.

Tasks:

7.1 Firestore Schema Summary
   - For each collection/subcollection:
     - Path (e.g. `/users`, `/users/{uid}/goals`, `/bookings`)
     - Purpose (1–2 sentences)
     - Key fields (with types and descriptions)
     - Important relationships (e.g. `bookings.userId → users/{uid}`)

7.2 Differences from original Supabase (inferred)
   - Highlight:
     - Which Supabase tables were merged or split.
     - Where denormalization changed the structure.
     - Any lost or intentionally dropped details (e.g., detailed log tables).

7.3 “Implementation TODO” list
   - List concrete next actions for developers:
     - Implement the schema manifest as code (types + converters).
     - Implement the security rules.
     - Create CSV templates for manual import.
     - Integrate Firestore service layer into React/Cloud Run code.

=====================================================================
INTERACTIVE RULES
=====================================================================

1. Do NOT invent sensitive data or production keys.
   - Work only with schema and structure.

2. If you hit a point where:
   - A table’s purpose is ambiguous,
   - OR an access pattern is unclear,
   - OR a field’s meaning is critical but not obvious,
   - You MUST ask me a clarifying question instead of silently guessing.

3. If SUPABASE_INVENTORY.md doesn’t include enough detail for a specific part of the model:
   - Propose a reasonable default.
   - Label it clearly as an assumption.
   - Ask me if that assumption is acceptable.

At the end, output:

- The Firestore Schema Manifest (JSON or YAML).
- A draft `firestore.rules` file.
- A list of suggested indexes.
- CSV/JSON template definitions for future imports.
- And a concise “Reconstructed Firestore Database Overview” that I can use as architecture documentation.
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
