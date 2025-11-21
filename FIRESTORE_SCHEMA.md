# Firestore Schema Manifest

## 1. Top-Level Collections

### `/users/{uid}`
**Description**: Canonical user profile and settings.
**Source**: `zg_profiles` + `user_roles`
**Fields**:
- `uid` (string): Firebase Auth UID.
- `email` (string): Primary email.
- `displayName` (string): Full name.
- `photoURL` (string): Avatar URL.
- `roles` (array<string>): e.g. `['admin', 'client', 'coach']`.
- `createdAt` (timestamp)
- `preferences` (map):
  - `language` (string)
  - `timezone` (string)
- `metadata` (map):
  - `migrationSource` (string): 'supabase'
  - `originalId` (string): Supabase UUID (if different).

### `/events/{eventId}`
**Description**: Public event details.
**Source**: `events`
**Fields**:
- `title` (string)
- `slug` (string)
- `description` (string)
- `startTime` (timestamp)
- `endTime` (timestamp)
- `location` (string)
- `published` (boolean)
- `pricing` (map)
- `images` (array)

### `/bookings/{bookingId}`
**Description**: User bookings for coaching or events.
**Source**: `cal_bookings`
**Fields**:
- `userId` (string): Ref to `/users/{uid}`.
- `typeId` (string): Ref to `/config/calendar_types/{typeId}`.
- `startTime` (timestamp)
- `endTime` (timestamp)
- `status` (string): 'confirmed', 'cancelled', etc.
- `meetingUrl` (string)

### `/orders/{orderId}`
**Description**: Payment records.
**Source**: `express_orders`
**Fields**:
- `userId` (string)
- `amount` (number)
- `currency` (string)
- `items` (array)
- `status` (string)
- `createdAt` (timestamp)
- `providerId` (string): Stripe/etc ID.

### `/registrations/{regId}`
**Description**: Event registrations/tickets.
**Source**: `event_regs` + `event_tickets`
**Fields**:
- `eventId` (string)
- `userId` (string)
- `status` (string)
- `ticketType` (string)
- `checkedIn` (boolean)
- `createdAt` (timestamp)

### `/leads/{leadId}`
**Description**: Captured leads.
**Source**: `leads`
**Fields**:
- `email` (string)
- `source` (string)
- `tags` (array)
- `status` (string)
- `createdAt` (timestamp)

### `/blog_posts/{slug}`
**Description**: Content posts.
**Source**: `blog_posts`
**Fields**:
- `title` (string)
- `content` (string)
- `excerpt` (string)
- `authorId` (string)
- `publishedAt` (timestamp)
- `tags` (array)

### `/products/coaching/{offerId}`
**Description**: Coaching packages.
**Source**: `coaching_offers`
**Fields**:
- `title` (string)
- `description` (string)
- `price` (number)
- `features` (array)

### `/referrals/{referralId}`
**Description**: Referral tracking.
**Source**: `zg_referrals`
**Fields**:
- `referrerId` (string)
- `refereeEmail` (string)
- `status` (string)

## 2. User Subcollections

### `/users/{uid}/goals/{goalId}`
**Source**: `me_goals`
- `title`, `status`, `deadline`.

### `/users/{uid}/sessions/{sessionId}`
**Source**: `me_sessions`
- `notes`, `actionItems`, `date`.

### `/users/{uid}/receipts/{receiptId}`
**Source**: `me_receipts`
- `amount`, `date`, `url`.

### `/users/{uid}/notifications/{nudgeId}`
**Source**: `nudge_inbox`
- `message`, `read`, `type`.

## 3. Configuration Collections

### `/config/calendar_types/{typeId}`
**Source**: `cal_event_types`
- `name`, `duration`, `slug`.

### `/config/funnels/{funnelId}`
**Source**: `funnels` + `funnel_stages`
- `name`, `trigger`, `stages` (array of objects).

### `/config/system`
**Doc**: `version`
**Source**: `zg_versions`
- `currentVersion`, `minVersion`.

## 4. Security Model (Brief)

- **Users**: Read own, Write own (restricted). Admin read all.
- **Events/Blog/Products**: Public Read. Admin Write.
- **Bookings/Orders**: Read own. Admin read all.
- **Config**: Public Read (some). Admin Write.
