# SEO Monitoring System Guide

## Overview

An automated SEO monitoring system that tracks external SEO changes (Google Search Central, Schema.org updates) and continuously monitors your site's SEO health with actionable alerts in the admin dashboard.

## Features

### 1. **External Source Monitoring**
- **Google Search Central**: Monitors official Google search blog for algorithm updates, policy changes, and new SEO guidelines
- **Schema.org Changes**: Tracks structured data specification updates
- **Core Web Vitals**: Monitors performance thresholds (LCP, INP, CLS)

### 2. **Local Site Health Checks**
Automatically scans your website for:
- ✅ robots.txt presence and accessibility
- ✅ sitemap.xml reachability
- ✅ Open Graph tags on key pages
- ✅ JSON-LD structured data implementation
- ✅ HTML lang attributes for international SEO

### 3. **Alert System**
Three severity levels with visual indicators:
- 🔴 **CRITICAL**: Urgent issues blocking SEO (e.g., missing robots.txt)
- 🟡 **WARN**: Important but non-blocking (e.g., missing OG tags)
- 🔵 **INFO**: Informational updates (e.g., new Google algorithm)

## Architecture

### Database Tables

#### `seo_watch_sources`
Defines what external sources to monitor:
```sql
- key: Unique identifier (e.g., 'google_search_central')
- label: Human-readable name
- enabled: Toggle monitoring on/off
- last_checked_at: Timestamp of last scan
- extra: JSON configuration (feed URLs, thresholds)
```

#### `seo_alerts`
Stores all SEO alerts:
```sql
- severity: 'info' | 'warn' | 'critical'
- title: Alert headline
- message: Detailed description
- source_key: Reference to watch source
- action_url: Link to fix/learn more
- created_at: When alert was created
- resolved_at: When admin marked as resolved
- resolution_note: Optional admin comment
```

#### `seo_site_snapshots`
Historical record of site checks:
```sql
- checklist: JSON snapshot of scan results
- created_at: Scan timestamp
```

#### `seo_notify_settings`
Admin notification preferences (future use):
```sql
- email: Email for alerts
- slack_webhook: Slack integration
- locale: Preferred language
```

## Components

### Backend

#### Edge Function: `seo-watch`
**Location**: `supabase/functions/seo-watch/index.ts`

**What it does**:
1. Fetches RSS feeds from enabled external sources
2. Parses latest updates and creates info alerts
3. Runs local site health checks on key pages
4. Creates warn/critical alerts for issues found
5. Saves snapshots for historical tracking
6. Updates last_checked_at timestamps

**How to trigger**:
```typescript
// Manual trigger from admin UI
const { error } = await supabase.functions.invoke('seo-watch');

// Or set up a cron job (recommended)
```

#### API Routes

**GET `/api/admin/seo/alerts`**
- Query params: `?open=1` (unresolved only) or `?all=1` (include resolved)
- Returns: Array of alert objects
- Auth: Admin only (RLS enforced)

**POST `/api/admin/seo/resolve`**
- Body: `{ id: string, note?: string }`
- Action: Marks alert as resolved
- Auth: Admin only

**GET/POST `/api/admin/seo/sources`**
- GET: Returns all watch sources with status
- POST: Toggle source enabled status
- Body: `{ id: string, enabled: boolean }`
- Auth: Admin only

### Frontend

#### `SeoAlertBanner`
**Location**: `src/components/admin/SeoAlertBanner.tsx`

Displays the most critical unresolved alert at the top of the admin dashboard:
- Auto-refreshes every 5 minutes
- Color-coded by severity
- "Learn more" link to documentation
- "Dismiss" button to mark as resolved

#### `AdminSEO`
**Location**: `src/pages/AdminSEO.tsx`

Full SEO monitoring dashboard with:
- List of enabled/disabled monitoring sources
- Toggle switches to enable/disable each source
- Active alerts section with all unresolved issues
- Resolved alerts history
- "Run Scan Now" button for manual triggers
- Visual severity indicators

## Usage

### For Admins

1. **View Alerts**
   - Navigate to `/admin` - Top banner shows most critical issue
   - Navigate to `/admin/seo` - See all alerts and manage sources

2. **Run Manual Scan**
   - Go to `/admin/seo`
   - Click "Run Scan Now"
   - Wait for completion toast
   - Review new alerts

3. **Manage Monitoring Sources**
   - Go to `/admin/seo`
   - Toggle switches to enable/disable sources
   - Useful for reducing noise or focusing on specific areas

4. **Resolve Alerts**
   - Click "Mark Resolved" on any alert
   - Optionally add a resolution note
   - Alert moves to "Resolved" section

### Setting Up Automated Scans

**Recommended**: Run SEO scans daily or weekly using cron jobs.

#### Option 1: Supabase Cron (Recommended)

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily SEO scan at 9 AM UTC
SELECT cron.schedule(
  'daily-seo-scan',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jwpnybimcqzcmbkjcqyj.supabase.co/functions/v1/seo-watch',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

#### Option 2: External Cron Service
Use services like:
- Vercel Cron
- GitHub Actions
- Cron-job.org
- EasyCron

Make a POST request to your edge function:
```bash
curl -X POST https://jwpnybimcqzcmbkjcqyj.supabase.co/functions/v1/seo-watch \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Alert Types

### External Source Alerts

**Google Search Central Updates**
- Severity: `info`
- Trigger: New blog post detected
- Action: Review change and adapt strategy

**Schema.org Changes**
- Severity: `info`
- Trigger: New release detected
- Action: Verify JSON-LD compatibility

### Local Site Alerts

**Missing robots.txt**
- Severity: `critical`
- Impact: Search engines may not crawl correctly
- Fix: Ensure `/robots.txt` is accessible

**Sitemap Not Reachable**
- Severity: `warn`
- Impact: Search engines may not discover all pages
- Fix: Verify `/sitemap.xml` is live

**Missing Open Graph Tags**
- Severity: `warn`
- Impact: Poor social media sharing previews
- Fix: Add `<meta property="og:...">` tags

**Missing JSON-LD**
- Severity: `warn`
- Impact: Reduced rich snippet opportunities
- Fix: Add structured data scripts

**Missing lang Attribute**
- Severity: `warn`
- Impact: Poor international SEO signals
- Fix: Add `<html lang="...">` attribute

## Customization

### Add New Watch Sources

```sql
INSERT INTO public.seo_watch_sources (key, label, extra) VALUES
  ('bing_webmaster', 'Bing Webmaster Blog', '{"feed":"https://blogs.bing.com/webmaster/feed/"}'),
  ('moz_blog', 'Moz SEO Blog', '{"feed":"https://moz.com/blog/feed"}');
```

Then update the edge function to handle the new source.

### Add New Page Checks

Edit `supabase/functions/seo-watch/index.ts`:

```typescript
const CHECKLIST_PAGES = [
  '/', 
  '/home', 
  '/coaching', 
  '/events',
  '/blog',        // Add new pages here
  '/about'
];
```

### Customize Alert Thresholds

Modify severity levels based on your priorities:

```typescript
// In edge function
if (!chk.sitemap) {
  await supabase.from('seo_alerts').insert({
    severity: 'critical',  // Changed from 'warn'
    // ...
  });
}
```

### Add Email Notifications

Update the `seo_notify_settings` table and modify the edge function:

```typescript
// After creating alerts
const { data: settings } = await supabase
  .from('seo_notify_settings')
  .select('email')
  .maybeSingle();

if (settings?.email && newCriticalAlerts.length > 0) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'SEO Monitor <seo@zhengrowth.com>',
      to: settings.email,
      subject: `${newCriticalAlerts.length} Critical SEO Issues Detected`,
      html: `...`
    })
  });
}
```

## Performance Considerations

### Edge Function Execution Time
- Typical: 3-8 seconds
- RSS fetches: ~1-2s per source
- Page checks: ~500ms per page
- Database operations: ~100ms total

### Optimization Tips
1. **Disable unused sources** to reduce scan time
2. **Reduce CHECKLIST_PAGES** to essential routes only
3. **Run scans off-peak** (e.g., 3 AM UTC)
4. **Use CDN caching** for checked pages

## Troubleshooting

### Alerts Not Appearing

1. **Check edge function logs**
   ```
   View in Lovable Cloud backend logs
   ```

2. **Verify RLS policies**
   - Ensure admin user has proper role in `user_roles` table
   - Test with: `SELECT is_admin();`

3. **Check API routes**
   - Open browser console on `/admin/seo`
   - Look for 403/401 errors

### RSS Feeds Failing

1. **Check feed URLs** in `seo_watch_sources.extra`
2. **Verify CORS** - some feeds may block requests
3. **Check User-Agent** - some sites require specific headers

### Page Checks Returning False Positives

1. **SPA routing** - Ensure pages render meta tags server-side or in initial HTML
2. **Lazy loading** - Meta tags must be in initial HTML, not loaded async
3. **Redirects** - Check if pages redirect (301/302)

## Security

### RLS Policies
All tables are admin-only except:
- `seo_site_snapshots` - Service role can insert (for edge function)

### API Authentication
All API routes should verify admin status:
```typescript
const { data: { session } } = await supabase.auth.getSession();
// Verify session.user is admin
```

### Edge Function
Uses service role key for database operations.

## Related Documentation

- `SEO_IMPLEMENTATION_SUMMARY.md` - Complete SEO setup
- `OG_PREVIEW_IMPLEMENTATION.md` - Open Graph implementation
- `ROBOTS_SEO_GUIDE.md` - robots.txt and indexing

## Next Steps

### Immediate
- [x] Database tables created
- [x] Edge function implemented
- [x] API routes created
- [x] Admin UI components built
- [ ] Test manual scan from admin UI
- [ ] Verify alerts display correctly

### Short-term
- [ ] Set up automated daily scans via cron
- [ ] Add email notifications for critical alerts
- [ ] Expand page check list
- [ ] Add more external sources (Bing, Moz)

### Long-term
- [ ] Historical trend analysis
- [ ] Automated issue resolution suggestions
- [ ] Integration with Google Search Console API
- [ ] Performance metrics tracking (Core Web Vitals)
- [ ] Competitive analysis features

## Examples

### Manual Trigger from Code
```typescript
import { supabase } from '@/integrations/supabase/client';

async function runSEOScan() {
  const { data, error } = await supabase.functions.invoke('seo-watch');
  
  if (error) {
    console.error('SEO scan failed:', error);
    return;
  }
  
  console.log('Scan results:', data);
}
```

### Query Recent Alerts
```typescript
const { data: alerts } = await supabase
  .from('seo_alerts')
  .select('*')
  .is('resolved_at', null)
  .order('severity', { ascending: false })
  .order('created_at', { ascending: false });
```

### Get Historical Snapshots
```typescript
const { data: snapshots } = await supabase
  .from('seo_site_snapshots')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(30);

// Compare over time
const robotsTrend = snapshots.map(s => ({
  date: s.created_at,
  hasRobots: s.checklist.robots
}));
```

## Support

For issues or questions:
- Review edge function logs in Lovable Cloud backend
- Check browser console for API errors
- Verify admin role permissions
- Ensure all tables have proper RLS policies
