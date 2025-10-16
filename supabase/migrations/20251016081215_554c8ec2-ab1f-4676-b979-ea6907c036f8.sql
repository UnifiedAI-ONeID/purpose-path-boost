-- Content versioning system for cache invalidation

-- 1) Version tracking table (single source of truth)
create table if not exists public.zg_versions (
  key text primary key,
  v bigint not null default 1,
  updated_at timestamptz default now()
);

-- Insert initial version
insert into public.zg_versions(key, v) 
values ('content', 1)
on conflict (key) do nothing;

-- Enable RLS
alter table public.zg_versions enable row level security;

-- Anyone can read versions
create policy "Anyone can view versions"
  on public.zg_versions for select
  using (true);

-- Admins can manage versions
create policy "Admins can manage versions"
  on public.zg_versions for all
  using (is_admin());

-- 2) Helper function to bump version
create or replace function public.bump_content_version()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.zg_versions 
  set v = v + 1, updated_at = now() 
  where key = 'content';
  return null;
end;
$$;

-- 3) Manual bump function for admins
create or replace function public.bump_version_now()
returns void 
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;
  
  update public.zg_versions 
  set v = v + 1, updated_at = now() 
  where key = 'content';
end;
$$;

-- 4) Attach triggers to content tables

-- coaching_offers
drop trigger if exists trg_bump_offers on public.coaching_offers;
create trigger trg_bump_offers 
  after insert or update or delete on public.coaching_offers
  for each statement execute function public.bump_content_version();

-- coaching_pages
drop trigger if exists trg_bump_coaching_pages on public.coaching_pages;
create trigger trg_bump_coaching_pages 
  after insert or update or delete on public.coaching_pages
  for each statement execute function public.bump_content_version();

-- blog_posts
drop trigger if exists trg_bump_blogs on public.blog_posts;
create trigger trg_bump_blogs 
  after insert or update or delete on public.blog_posts
  for each statement execute function public.bump_content_version();

-- events
drop trigger if exists trg_bump_events on public.events;
create trigger trg_bump_events 
  after insert or update or delete on public.events
  for each statement execute function public.bump_content_version();

-- event_tickets
drop trigger if exists trg_bump_tickets on public.event_tickets;
create trigger trg_bump_tickets 
  after insert or update or delete on public.event_tickets
  for each statement execute function public.bump_content_version();

-- remote_flags
drop trigger if exists trg_bump_flags on public.remote_flags;
create trigger trg_bump_flags 
  after insert or update or delete on public.remote_flags
  for each statement execute function public.bump_content_version();

-- i18n_translations
drop trigger if exists trg_bump_i18n on public.i18n_translations;
create trigger trg_bump_i18n 
  after insert or update or delete on public.i18n_translations
  for each statement execute function public.bump_content_version();

-- cal_event_types
drop trigger if exists trg_bump_cal_types on public.cal_event_types;
create trigger trg_bump_cal_types 
  after insert or update or delete on public.cal_event_types
  for each statement execute function public.bump_content_version();