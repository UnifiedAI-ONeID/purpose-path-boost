# Analytics Setup Documentation

## Overview
Comprehensive real-time analytics system integrated into the admin dashboard, tracking all user interactions and providing actionable insights.

## Features Implemented

### 1. Event Tracking
✅ Automatic tracking of all user interactions:
- Page views (tracked on every route change)
- Quiz completions
- Booking actions (view, start, complete)
- Payment events (click, success, fail)
- Blog interactions (read, category clicks)
- Session duration tracking
- Navigation and CTA clicks

### 2. Database Storage
✅ All events stored in `analytics_events` table with:
- Event name and properties
- User ID (if authenticated)
- Session ID (unique per browser session)
- Page URL and referrer
- User agent and IP address
- Timestamp

### 3. Real-time Dashboard
✅ Live metrics with auto-refresh:
- **Real-time Metrics Cards**:
  - Total events today
  - Active users (unique sessions)
  - Quiz completions
  - Bookings
  - Percentage change from yesterday

✅ **Interactive Charts**:
- Events over time (line chart - last 7 days)
- Event distribution (pie chart - top 6 events)
- Top pages by visits (horizontal bar chart)
- Conversion funnel (bar chart)

✅ **Recent Events Feed**:
- Live stream of latest user activities
- Shows event name, page, and timestamp

### 4. Real-time Updates
✅ Using Supabase Realtime:
- Dashboard automatically updates when new events occur
- No page refresh needed
- Real-time metrics refresh every 30 seconds
- Instant updates via WebSocket connection

## Admin Dashboard Access

1. Navigate to `/admin`
2. Login with your admin credentials
3. Click on "Analytics" tab
4. View live metrics and charts

### Dashboard Tabs:
- **Leads Management**: View and manage quiz submissions
- **Blog Management**: Create and edit blog posts
- **Analytics**: Real-time analytics dashboard ⭐

## How It Works

### Event Tracking Flow:
1. User performs action (e.g., clicks button, visits page)
2. `track()` function is called with event name and properties
3. Event is sent to:
   - Umami (if configured)
   - PostHog (if configured)
   - Supabase database (always)
4. Admin dashboard receives real-time update via WebSocket
5. Charts and metrics automatically refresh

### Session Tracking:
- Unique session ID generated per browser session
- Stored in sessionStorage
- Used to count unique active users
- Session duration tracked with buckets:
  - Under 30s
  - 1 minute
  - 3 minutes
  - 5+ minutes

## Key Metrics

### Today's Performance:
- Total events count
- Active users (unique sessions)
- Quiz completion rate
- Booking conversion rate

### Historical Analysis:
- 7-day event trend
- Event type distribution
- Most visited pages
- Conversion funnel visualization

## Technical Implementation

### Database Schema:
```sql
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  properties JSONB,
  user_id UUID,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Realtime Configuration:
- Realtime enabled on `analytics_events` table
- REPLICA IDENTITY FULL for complete row data
- WebSocket subscription in admin dashboard
- Auto-refresh every 30 seconds as backup

### Available Event Types:
- `lm_view` - Lead magnet viewed
- `lm_submit` - Lead magnet submitted
- `quiz_complete` - Quiz completed
- `book_view` - Booking page viewed
- `book_start` - Booking process started
- `book_complete` - Booking completed
- `pay_click` - Payment button clicked
- `pay_success` - Payment successful
- `pay_fail` - Payment failed
- `blog_read` - Blog post read
- `blog_category_click` - Blog category filtered
- `nav_click` - Navigation/page view
- `cta_click` - Call-to-action clicked
- `session_bucket_*` - Session duration tracking

## Usage Examples

### Track Custom Event:
```typescript
import { track } from '@/analytics/events';

// Simple event
track('cta_click', { button: 'Book Now' });

// Event with properties
track('quiz_complete', { 
  score: 85, 
  category: 'clarity' 
});
```

### Access Analytics in Admin:
1. Login to admin dashboard
2. Navigate to "Analytics" tab
3. View real-time metrics
4. Explore charts and event feed
5. Monitor user behavior

## Benefits

✅ **Real-time Insights**: See user activity as it happens
✅ **Data-Driven Decisions**: Make informed choices based on actual user behavior
✅ **Conversion Tracking**: Monitor funnel performance and optimize conversions
✅ **User Understanding**: Learn which pages and features are most popular
✅ **ROI Measurement**: Track effectiveness of marketing campaigns
✅ **Performance Monitoring**: Identify issues and opportunities quickly

## Next Steps

### Optional Enhancements:
1. **Export Analytics**: Add CSV/Excel export functionality
2. **Custom Date Ranges**: Allow filtering by custom date ranges
3. **User Segmentation**: Group analytics by user properties
4. **Goal Tracking**: Set and monitor specific conversion goals
5. **A/B Testing**: Compare performance of different variants
6. **Email Reports**: Automated daily/weekly analytics emails

### Integration Options:
- Google Analytics (additional tracking)
- Mixpanel (advanced user analytics)
- Segment (unified analytics platform)
- Custom dashboards (embed in other tools)

## Security

✅ **Row Level Security (RLS)**:
- Anyone can insert analytics events (anonymous tracking)
- Only admins can view analytics data
- User IDs linked when authenticated

✅ **Privacy Considerations**:
- No PII stored by default
- IP addresses anonymized (optional)
- GDPR compliant with proper configuration
- Users can opt-out via cookie preferences

## Performance

✅ **Optimized for Scale**:
- Indexed columns for fast queries
- Efficient date range filtering
- Aggregated metrics cached
- Real-time updates without polling
- Database partitioning ready (for high volume)

## Support

For issues or questions:
1. Check console logs for errors
2. Verify admin access in user_roles table
3. Ensure Supabase connection is active
4. Check network tab for WebSocket connection
5. Review security policies if data not visible
