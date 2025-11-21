# Firestore Backup & Export Strategy

## 1. Daily Backups (Disaster Recovery)

### Goal
Ensure full data recovery in case of accidental deletion or corruption.

### Mechanism
Use **Google Cloud Firestore Export/Import service** via Cloud Scheduler + Cloud Functions.

### Schedule
- **Frequency**: Daily at 02:00 UTC.
- **Target**: Google Cloud Storage Bucket `gs://zhengrowth-backups`.

### Configuration
- **Collections**: All keys (`users`, `bookings`, `orders`, `events`, `coaching_offers`, `blog_posts`, `leads`).
- **Retention**: 
  - Daily backups: 30 days.
  - Monthly snapshots: 1 year (handled by GCS Lifecycle Rules).

### Setup Command (Example)
```bash
gcloud firestore export gs://zhengrowth-backups --collection-ids='users','bookings','orders'
```

## 2. Analytics Export (BigQuery)

### Goal
Enable complex analysis (SQL) without impacting Firestore performance.

### Mechanism
**Stream Firestore to BigQuery Extension** (Firebase Extensions).

### Configuration
- **Collections Syncing**:
  - `users` -> `firestore_export.users`
  - `orders` -> `firestore_export.orders`
  - `bookings` -> `firestore_export.bookings`
  - `leads` -> `firestore_export.leads`

### Benefits
- Real-time (near real-time) data in BigQuery.
- Allows joining with GA4 data.
- Build Data Studio / Looker dashboards on top.

## 3. Manual Export (Ad-hoc)

For major migrations or local testing:
1. Go to GCP Console > Firestore > Import/Export.
2. Click "Export".
3. Select bucket.

## 4. Supabase Archive

The Supabase project is kept as a **Read-Only Archive**.
- **Inventory**: See `SUPABASE_INVENTORY.md`.
- **Access**: Admin only.
- **Sunset Date**: TBD (recommend 6 months post-migration).
