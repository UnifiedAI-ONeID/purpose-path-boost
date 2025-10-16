-- Add chapters support and performance index

-- Add chapters column to lessons
alter table public.lessons
  add column if not exists chapters jsonb;

-- Fast lookup for continue watching feature
create index if not exists lesson_progress_recent_idx
  on public.lesson_progress (profile_id, completed, last_watched_at desc);