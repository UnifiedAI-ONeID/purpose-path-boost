b# Migration Tools: Supabase to Firebase

This directory contains scripts to migrate data from Supabase to Firebase Firestore and Authentication.

## Prerequisites

1.  **Node.js**: Ensure you have Node.js installed.
2.  **Service Account**: You need a Firebase Service Account JSON file for full admin access (especially for Auth migration).
3.  **Supabase Credentials** (For Migration): You need your Supabase URL and Service Role Key.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure Environment:
    Copy `.env.example` to `.env` and fill in the values:
    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_KEY=your_supabase_service_key
    FIREBASE_SERVICE_ACCOUNT={"type": "service_account", ...}
    ```

## Option A: Migrate from Supabase (Requires Credentials)

You can run all migrations in sequence using:

```bash
npm run migrate:all
```

Or run individual scripts:

```bash
# Migrate Users (Profiles -> Auth + Firestore)
npm run migrate:users

# Migrate Content (Blog, Lessons)
npx ts-node scripts/migrate_content.ts

# Migrate Events
npm run migrate:events
```

## Option B: Start Fresh (No Supabase Access)

If you cannot access the old database or want to start with a clean slate, run the seed script. This will populate the database with necessary configuration (Pricing Tiers, default Event Types) so the app works.

```bash
npx ts-node scripts/seed_fresh.ts
```

## Migration Scope

- **Auth**: Creates Firebase Auth users with same UIDs as Supabase.
- **Users**: Migrates profiles to `/users` collection.
- **Content**: Migrates Blog Posts and Lessons.
- **Events**: Migrates Events and Registrations.
- **Commerce**: Migrates Coaching Offers and Orders.
- **Leads**: Migrates Leads, Funnels, and Referrals.
- **User Data**: Migrates Goals, Sessions, Receipts, Notifications.
