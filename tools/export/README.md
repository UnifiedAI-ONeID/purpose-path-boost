# Database Export Tools

## Overview

This directory contains tools for exporting data from Supabase to CSV format for migration to Firebase/Firestore.

## Export Script

### `export_all_to_csv.ts`

Exports all database tables to individual CSV files.

**Usage:**

```bash
# Make sure you have the SUPABASE_SERVICE_ROLE_KEY secret set
cd tools/export
tsx export_all_to_csv.ts
```

**Output:**

CSV files are saved to `tools/export/csv_exports/`:
- One CSV file per table
- `_export_summary.json` contains export metadata

**Tables Exported:**

- **User Management:** zg_profiles, user_roles, user_badges
- **Coaching:** coaching_offers, cal_bookings, cal_event_types, me_sessions, me_goals, me_receipts
- **Content:** blog_posts, blog_templates, lessons, lesson_progress
- **E-Commerce:** bookings, express_orders, payments, coupons
- **Events:** events_catalog, event_prices, event_regs
- **Marketing:** leads, funnels, funnel_stages, user_funnel_progress, zg_referrals
- **Analytics:** analytics_events, experiments, experiment_assignments
- **AI:** ai_logs, ai_suggestions_cache
- **Community:** community_posts, community_comments, community_reports
- **Social:** social_accounts, social_posts, social_analytics
- **Config:** remote_flags, i18n_dict, email_templates, email_queue, email_logs, badges, zg_versions
- **Notifications:** nudge_inbox, push_subscriptions

## CSV Format

- Headers in first row
- Values escaped per RFC 4180 CSV standard
- JSON fields (objects/arrays) are JSON-stringified
- Empty values for NULL
- UTF-8 encoding

## Next Steps

After export:

1. **Review data:** Check CSV files for completeness
2. **Transform:** Map Supabase structure to Firestore schema
3. **Import:** Use Firebase Admin SDK to import to Firestore
4. **Validate:** Verify all data migrated correctly

## Import to Firestore

See `tools/migration/` directory for Firestore import scripts.

## Security Notes

- CSV files may contain sensitive data (emails, tokens, etc.)
- Do NOT commit CSV files to version control
- Keep exports secure and delete after migration
- The `csv_exports/` directory is gitignored
