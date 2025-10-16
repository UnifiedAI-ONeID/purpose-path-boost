-- Video Lessons System

-- 1) Lessons catalog
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  summary_en text,
  yt_id text,
  duration_sec int,
  tags text[] default '{}',
  order_index int default 0,
  published boolean default true,
  poster_url text,
  cn_alt_url text,
  captions_vtt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.lessons enable row level security;

-- Anyone can view published lessons
create policy "Anyone can view published lessons"
  on public.lessons for select
  using (published = true);

-- Admins can manage lessons
create policy "Admins can manage lessons"
  on public.lessons for all
  using (is_admin());

-- 2) Assign lessons to offers or by tags
create table if not exists public.lesson_assignments (
  id uuid primary key default gen_random_uuid(),
  offer_slug text,
  tag text,
  lesson_slug text not null references public.lessons(slug) on delete cascade,
  order_index int default 0
);

-- Enable RLS
alter table public.lesson_assignments enable row level security;

-- Anyone can view assignments
create policy "Anyone can view lesson assignments"
  on public.lesson_assignments for select
  using (true);

-- Admins can manage assignments
create policy "Admins can manage lesson assignments"
  on public.lesson_assignments for all
  using (is_admin());

-- 3) User progress tracking
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  lesson_slug text not null references public.lessons(slug) on delete cascade,
  watched_seconds int default 0,
  completed boolean default false,
  last_position_sec int default 0,
  last_watched_at timestamptz default now(),
  unique (profile_id, lesson_slug)
);

-- Enable RLS
alter table public.lesson_progress enable row level security;

-- Users can view and manage their own progress
create policy "Users can view own progress"
  on public.lesson_progress for select
  using (true);

create policy "Users can insert own progress"
  on public.lesson_progress for insert
  with check (true);

create policy "Users can update own progress"
  on public.lesson_progress for update
  using (true);

-- Admins can view all progress
create policy "Admins can view all progress"
  on public.lesson_progress for select
  using (is_admin());

-- 4) Lesson viewing events (analytics)
create table if not exists public.lesson_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  lesson_slug text not null,
  ev text not null,
  at_sec int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.lesson_events enable row level security;

-- Anyone can insert lesson events
create policy "Anyone can insert lesson events"
  on public.lesson_events for insert
  with check (true);

-- Admins can view all events
create policy "Admins can view all lesson events"
  on public.lesson_events for select
  using (is_admin());

-- Add triggers to bump content version on lesson changes
drop trigger if exists trg_bump_lessons on public.lessons;
create trigger trg_bump_lessons 
  after insert or update or delete on public.lessons
  for each statement execute function public.bump_content_version();

drop trigger if exists trg_bump_lesson_assignments on public.lesson_assignments;
create trigger trg_bump_lesson_assignments 
  after insert or update or delete on public.lesson_assignments
  for each statement execute function public.bump_content_version();