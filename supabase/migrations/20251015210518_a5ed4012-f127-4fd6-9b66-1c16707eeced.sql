-- Add index for fast scheduled post dispatch
create index if not exists social_posts_sched_idx on social_posts (status, scheduled_at);