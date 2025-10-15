# Social Media Automation with Cron Jobs

## Overview
Automate social media posting and metrics collection using Supabase cron jobs.

## Setup

### 1. Enable Required Extensions

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron for scheduled jobs
create extension if not exists pg_cron with schema extensions;

-- Enable pg_net for HTTP requests
create extension if not exists pg_net with schema extensions;
```

### 2. Create Cron Jobs

#### Auto-Process Social Queue (Every 15 Minutes)
```sql
select cron.schedule(
  'process-social-queue',
  '*/15 * * * *', -- Every 15 minutes
  $$
  select
    net.http_post(
        url:='https://jwpnybimcqzcmbkjcqyj.supabase.co/functions/v1/social-worker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cG55YmltY3F6Y21ia2pjcXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzE1NDYsImV4cCI6MjA3NjA0NzU0Nn0.eyM9iPopcvmMtj7eDkk_p5nZEGCI3cFV8u87RVhpZdM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

#### Collect Metrics (Every 6 Hours)
```sql
select cron.schedule(
  'collect-social-metrics',
  '0 */6 * * *', -- Every 6 hours
  $$
  select
    net.http_post(
        url:='https://jwpnybimcqzcmbkjcqyj.supabase.co/functions/v1/social-metrics-collect',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cG55YmltY3F6Y21ia2pjcXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzE1NDYsImV4cCI6MjA3NjA0NzU0Nn0.eyM9iPopcvmMtj7eDkk_p5nZEGCI3cFV8u87RVhpZdM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

#### Daily AI Content Suggestions (Every Morning at 9 AM UTC+8)
```sql
select cron.schedule(
  'daily-content-suggestions',
  '0 1 * * *', -- 1 AM UTC = 9 AM Shanghai
  $$
  select
    net.http_post(
        url:='https://jwpnybimcqzcmbkjcqyj.supabase.co/functions/v1/ai-suggest-topics',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cG55YmltY3F6Y21ia2pjcXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzE1NDYsImV4cCI6MjA3NjA0NzU0Nn0.eyM9iPopcvmMtj7eDkk_p5nZEGCI3cFV8u87RVhpZdM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### 3. Manage Cron Jobs

#### View All Scheduled Jobs
```sql
select * from cron.job;
```

#### View Job Run History
```sql
select * from cron.job_run_details 
order by start_time desc 
limit 50;
```

#### Unschedule a Job
```sql
select cron.unschedule('process-social-queue');
```

#### Update a Job Schedule
```sql
-- Unschedule first
select cron.unschedule('process-social-queue');

-- Then create with new schedule
select cron.schedule(
  'process-social-queue',
  '*/30 * * * *', -- Changed to every 30 minutes
  $$ ... $$
);
```

## Cron Schedule Syntax

```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12)
 │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
 │ │ │ │ │
 * * * * *
```

### Common Patterns
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 9 * * *` - Every day at 9 AM UTC
- `0 1 * * *` - Every day at 1 AM UTC (9 AM Shanghai)
- `0 9 * * 1` - Every Monday at 9 AM UTC
- `0 0 1 * *` - First day of every month at midnight

## Advanced Workflows

### Scheduled Publishing
Queue posts with `scheduled_at` timestamp:

```sql
-- Add scheduled_at column if not exists
alter table social_posts add column if not exists scheduled_at timestamptz;

-- Update worker to respect scheduled times
-- Modify social-worker to check:
-- WHERE status = 'queued' 
-- AND (scheduled_at IS NULL OR scheduled_at <= NOW())
```

### Smart Scheduling
Post at optimal times per platform:

```sql
-- Example: Schedule posts for best times
insert into social_posts (blog_slug, platform, message, scheduled_at)
values 
  ('my-post', 'linkedin', 'Post content...', '2025-01-16 09:00:00+08'::timestamptz),  -- 9 AM Shanghai
  ('my-post', 'instagram', 'Post content...', '2025-01-16 19:00:00-08'::timestamptz), -- 7 PM Vancouver
  ('my-post', 'x', 'Post content...', '2025-01-16 12:00:00+08'::timestamptz);         -- Noon Shanghai
```

### Retry Failed Posts
Auto-retry failed posts:

```sql
select cron.schedule(
  'retry-failed-posts',
  '0 */3 * * *', -- Every 3 hours
  $$
  update social_posts
  set status = 'queued', error = null
  where status = 'failed'
    and created_at > now() - interval '24 hours'
    and (error not like '%permanent%' or error is null);
  $$
);
```

### Weekly Analytics Report
Store weekly analytics summaries:

```sql
create table if not exists weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  total_impressions bigint,
  total_engagements bigint,
  best_platform text,
  report_data jsonb,
  created_at timestamptz default now()
);

select cron.schedule(
  'weekly-analytics-report',
  '0 0 * * 1', -- Every Monday at midnight
  $$
  insert into weekly_reports (week_start, total_impressions, total_engagements, report_data)
  select 
    date_trunc('week', now() - interval '1 week')::date as week_start,
    sum(impressions) as total_impressions,
    sum(likes + comments + shares + coalesce(saves, 0)) as total_engagements,
    jsonb_agg(jsonb_build_object(
      'platform', platform,
      'impressions', impressions,
      'engagement', likes + comments + shares
    )) as report_data
  from social_metrics
  where captured_at >= date_trunc('week', now() - interval '1 week')
    and captured_at < date_trunc('week', now());
  $$
);
```

## Monitoring

### Check Job Health
```sql
-- Jobs that failed recently
select 
  jobid,
  jobname,
  start_time,
  end_time,
  status,
  return_message
from cron.job_run_details
where status = 'failed'
  and start_time > now() - interval '24 hours'
order by start_time desc;
```

### Success Rate
```sql
-- Success rate per job
select 
  jobname,
  count(*) as total_runs,
  count(*) filter (where status = 'succeeded') as successful,
  round(100.0 * count(*) filter (where status = 'succeeded') / count(*), 2) as success_rate
from cron.job_run_details
where start_time > now() - interval '7 days'
group by jobname;
```

## Best Practices

1. **Start Conservative**: Begin with longer intervals (e.g., every 30 minutes) and adjust based on needs
2. **Monitor Costs**: Frequent AI calls can add up; cache suggestions when possible
3. **Error Handling**: Check job run history regularly and set up alerts for failures
4. **Rate Limits**: Respect platform API rate limits; stagger metrics collection
5. **Timezone Awareness**: Use explicit timezone conversions for scheduled publishing
6. **Logging**: Edge functions log to Supabase logs; check for errors
7. **Testing**: Test cron jobs manually first via Supabase dashboard

## Troubleshooting

### Job Not Running
- Check `cron.job` to ensure it's scheduled
- Verify `pg_cron` extension is enabled
- Check edge function logs for errors

### HTTP Errors
- Verify function URL and authorization header
- Check if edge functions are deployed
- Ensure `pg_net` extension is enabled

### Permission Errors
- Cron jobs run as `postgres` user
- Ensure database policies allow operations
- Use service role key if needed in edge functions

## Cost Optimization

- Collect metrics every 6-12 hours instead of hourly
- Generate AI suggestions once daily instead of on-demand
- Cache AI suggestions for 24 hours
- Process queue every 15-30 minutes instead of every 5 minutes
- Use batching: process multiple posts per worker invocation
