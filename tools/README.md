# Data Import Tools

These scripts allow you to backfill your Firestore database using CSV files.

## Setup

1. Ensure you have a Firebase Service Account key (JSON).
   - Go to Firebase Console > Project Settings > Service Accounts.
   - Generate a new private key.
   - Save it as `service-account.json` in the root (DO NOT COMMIT THIS).
2. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
   ```
3. Install dependencies:
   ```bash
   cd tools
   npm install
   ```

## Running Imports

1. **Prepare Data**:
   - Edit `tools/import_templates/users_template.csv`
   - Edit `tools/import_templates/bookings_template.csv`

2. **Run Scripts**:
   ```bash
   # Import Users
   npx ts-node tools/import_scripts/import_users.ts

   # Import Bookings
   npx ts-node tools/import_scripts/import_bookings.ts
   ```

## Notes
- Scripts use `batch.set(..., { merge: true })`, so they are safe to re-run.
- Large files are handled in batches of 400 to respect Firestore limits.
