# Redundancy & Migration Map

## 1. Consolidated Collections

| Source Table(s) | Target Firestore Path | Merge Strategy |
| :--- | :--- | :--- |
| `zg_profiles`, `user_roles` | `/users/{uid}` | Merge `role` from `user_roles` into profile doc. Use Firebase Auth `uid` as doc ID. |
| `me_goals` | `/users/{uid}/goals/{goalId}` | Subcollection |
| `leads` | `/leads/{leadId}` | Direct mapping. Keep schema, `uid` as doc ID. |
| `ai_logs` | `/ai_logs/{logId}` | Direct mapping. |
| `me_sessions` | `/users/{uid}/sessions/{sessionId}` | Subcollection. Includes progress, notes. |
| `bookings` | `/bookings/{bookingId}` | New collection. Port from external system if needed. |
| `events` | `/events/{eventId}` | Direct mapping. |
| `blog_posts` | `/blog_posts/{postId}` | Direct mapping. |
