# Cal.com API Integration Guide

## Overview

This document covers the complete Cal.com API integration for ZhenGrowth, including webhook handling, booking management, availability checking, and event type synchronization.

## Features

1. **Webhook Handling**: Automatically capture booking events from Cal.com
2. **Booking Management**: View and sync all bookings from Cal.com
3. **Availability Checking**: Query real-time availability for event types
4. **Event Type Sync**: Keep event types synchronized with Cal.com

## Database Schema

### cal_bookings Table
Stores all booking information received from Cal.com webhooks and API sync.

```sql
- id: UUID (primary key)
- cal_booking_id: TEXT (unique, Cal.com booking ID)
- cal_uid: TEXT (Cal.com UID)
- event_type_id: TEXT
- event_type_slug: TEXT
- title: TEXT
- start_time: TIMESTAMPTZ
- end_time: TIMESTAMPTZ
- attendee_name: TEXT
- attendee_email: TEXT
- attendee_timezone: TEXT
- status: TEXT (scheduled, cancelled, rescheduled, completed)
- meeting_url: TEXT
- location: TEXT
- metadata: JSONB (full Cal.com booking object)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### cal_event_types Table
Stores event type definitions synced from Cal.com.

```sql
- id: UUID (primary key)
- cal_event_type_id: TEXT (unique)
- slug: TEXT
- title: TEXT
- description: TEXT
- length: INTEGER (duration in minutes)
- price: INTEGER (in cents)
- currency: TEXT
- active: BOOLEAN
- metadata: JSONB
- last_synced_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

## Edge Functions

### 1. cal-webhook
**Purpose**: Receive booking events from Cal.com webhooks

**Endpoint**: `https://your-project.supabase.co/functions/v1/cal-webhook`

**Events Handled**:
- `BOOKING_CREATED`: New booking created
- `BOOKING_RESCHEDULED`: Booking rescheduled
- `BOOKING_CANCELLED`: Booking cancelled

**Payload Example**:
```json
{
  "triggerEvent": "BOOKING_CREATED",
  "payload": {
    "id": 123,
    "uid": "abc123",
    "title": "30 min meeting",
    "startTime": "2025-10-16T10:00:00Z",
    "endTime": "2025-10-16T10:30:00Z",
    "attendees": [{
      "name": "John Doe",
      "email": "john@example.com",
      "timeZone": "America/New_York"
    }]
  }
}
```

### 2. cal-bookings
**Purpose**: Fetch and manage bookings

**Endpoints**:
- `GET /cal-bookings` - List all bookings from database
- `GET /cal-bookings?action=sync` - Sync bookings from Cal.com API

**Response**:
```json
{
  "bookings": [
    {
      "id": "uuid",
      "title": "Discovery Session",
      "attendee_name": "John Doe",
      "attendee_email": "john@example.com",
      "start_time": "2025-10-16T10:00:00Z",
      "status": "scheduled"
    }
  ]
}
```

### 3. cal-availability
**Purpose**: Check real-time availability for event types

**Endpoint**: `GET /cal-availability?eventTypeId=123&dateFrom=2025-10-16&dateTo=2025-10-23`

**Response**:
```json
{
  "busy": [
    {
      "start": "2025-10-16T10:00:00Z",
      "end": "2025-10-16T10:30:00Z"
    }
  ],
  "dateRanges": [
    {
      "start": "2025-10-16T09:00:00Z",
      "end": "2025-10-16T17:00:00Z"
    }
  ]
}
```

### 4. cal-event-types
**Purpose**: Fetch and sync event types

**Endpoints**:
- `GET /cal-event-types` - List all event types from database
- `GET /cal-event-types?action=sync` - Sync event types from Cal.com API

**Response**:
```json
{
  "event_types": [
    {
      "id": "uuid",
      "slug": "discovery",
      "title": "Discovery Session",
      "length": 30,
      "price": 0,
      "active": true
    }
  ]
}
```

## Cal.com Setup

### 1. Get API Key
1. Go to https://app.cal.com/settings/developer/api-keys
2. Click "Create API Key"
3. Copy the key and add it as `CAL_COM_API_KEY` secret in Supabase

### 2. Configure Webhooks
1. Go to https://app.cal.com/settings/developer/webhooks
2. Click "New Webhook"
3. Set webhook URL: `https://your-project.supabase.co/functions/v1/cal-webhook`
4. Select events:
   - Booking Created
   - Booking Rescheduled
   - Booking Cancelled
5. Save webhook

### 3. Create Event Types
Create your event types in Cal.com:
- `zhengrowth/discovery` - Free 30-min discovery session
- `zhengrowth/single-session` - Paid 60-min coaching session
- `zhengrowth/monthly-package` - Monthly coaching package

## Admin Dashboard

Access the Cal.com admin dashboard at `/admin/calendar`

**Features**:
- View all bookings with status badges
- Sync bookings from Cal.com API
- View and manage event types
- Real-time booking status updates

**Actions**:
- **Sync Bookings**: Fetch latest bookings from Cal.com API
- **Sync Event Types**: Update event type definitions
- **View Details**: See full booking information including meeting links

## Frontend Integration

### Check Availability
```typescript
const { data } = await supabase.functions.invoke('cal-availability', {
  body: {
    eventTypeId: '123',
    dateFrom: '2025-10-16',
    dateTo: '2025-10-23'
  }
});
```

### List Event Types
```typescript
const { data } = await supabase.functions.invoke('cal-event-types');
const eventTypes = data.event_types;
```

### Sync Bookings (Admin Only)
```typescript
const { data } = await supabase.functions.invoke('cal-bookings', {
  body: { action: 'sync' }
});
```

## Security

### RLS Policies
- **cal_bookings**:
  - Admins: Full read access
  - Webhook: Insert/update access
  - Public: No direct access

- **cal_event_types**:
  - Admins: Full CRUD access
  - Public: Read active event types only

### Webhook Security
- Webhooks are public endpoints (no auth required)
- Validate webhook payload structure
- Use service role key for database operations

## Monitoring

### Webhook Logs
Check edge function logs for webhook processing:
```bash
supabase functions logs cal-webhook
```

### Sync Status
View last sync time in `cal_event_types.last_synced_at`

### Booking Status
Monitor booking statuses:
- `scheduled` - Active booking
- `cancelled` - Cancelled by attendee
- `rescheduled` - Booking time changed
- `completed` - Session completed

## Troubleshooting

### Webhooks Not Received
1. Check webhook configuration in Cal.com
2. Verify webhook URL is correct
3. Check edge function logs for errors

### Sync Failures
1. Verify `CAL_COM_API_KEY` is configured
2. Check API key permissions in Cal.com
3. Review edge function logs

### Missing Bookings
1. Click "Sync Bookings" in admin dashboard
2. Check if bookings exist in Cal.com
3. Verify webhook is active

## API Reference

### Cal.com API Documentation
- API Docs: https://cal.com/docs/api-reference
- Webhook Events: https://cal.com/docs/api-reference/webhooks
- Authentication: https://cal.com/docs/api-reference/authentication

### Rate Limits
- Cal.com API: 100 requests per minute
- Webhook processing: No limit (async)

## Best Practices

1. **Always use webhooks** for real-time updates
2. **Sync periodically** (e.g., daily) as backup
3. **Store full payload** in metadata for debugging
4. **Monitor webhook logs** for processing errors
5. **Test webhooks** in staging before production

## Future Enhancements

Potential features to add:
- Automatic booking reminders
- Customer portal for viewing bookings
- Integration with payment processing
- Custom booking forms
- Analytics dashboard
- Email notifications
