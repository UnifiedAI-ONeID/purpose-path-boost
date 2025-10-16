-- PWA user profiles (device-based for now, can migrate to auth.users later)
create table if not exists public.zg_profiles (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.zg_profiles enable row level security;

create policy "Users can view own profile by device"
  on public.zg_profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.zg_profiles for insert
  with check (true);

create policy "Users can update own profile"
  on public.zg_profiles for update
  using (true);

-- Mirror booked sessions (from Cal.com webhook)
create table if not exists public.me_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.zg_profiles(id) on delete cascade,
  cal_event_id text unique,
  title text,
  start_at timestamptz,
  end_at timestamptz,
  join_url text,
  notes text,
  created_at timestamptz default now()
);

alter table public.me_sessions enable row level security;

create policy "Users can view own sessions"
  on public.me_sessions for select
  using (true);

create policy "Service can insert sessions"
  on public.me_sessions for insert
  with check (true);

create policy "Service can update sessions"
  on public.me_sessions for update
  using (true);

-- Airwallex receipts
create table if not exists public.me_receipts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.zg_profiles(id) on delete cascade,
  order_id text unique,
  amount_cents int,
  currency text,
  description text,
  created_at timestamptz default now(),
  raw jsonb
);

alter table public.me_receipts enable row level security;

create policy "Users can view own receipts"
  on public.me_receipts for select
  using (true);

create policy "Service can insert receipts"
  on public.me_receipts for insert
  with check (true);

-- Personal goals
create table if not exists public.me_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.zg_profiles(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active','done','paused')),
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.me_goals enable row level security;

create policy "Users can manage own goals"
  on public.me_goals for all
  using (true);

-- Private notes
create table if not exists public.me_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.zg_profiles(id) on delete cascade,
  session_id uuid references public.me_sessions(id) on delete cascade,
  body text,
  created_at timestamptz default now()
);

alter table public.me_notes enable row level security;

create policy "Users can manage own notes"
  on public.me_notes for all
  using (true);

-- Referrals
create table if not exists public.zg_referrals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.zg_profiles(id) on delete cascade,
  ref_code text unique not null,
  clicks int default 0,
  conversions int default 0,
  created_at timestamptz default now()
);

alter table public.zg_referrals enable row level security;

create policy "Users can view own referrals"
  on public.zg_referrals for select
  using (true);

create policy "Service can manage referrals"
  on public.zg_referrals for all
  using (true);

-- Trigger to update goals updated_at
create or replace function public.update_me_goals_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_me_goals_timestamp
  before update on public.me_goals
  for each row
  execute function public.update_me_goals_updated_at();

-- Function to calculate streak (simplified)
create or replace function public.get_user_streak(p_profile_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  streak_count int := 0;
begin
  -- Simple implementation: count distinct dates from last 30 days with sessions
  select count(distinct date(start_at))
  into streak_count
  from public.me_sessions
  where profile_id = p_profile_id
    and start_at >= now() - interval '30 days'
    and start_at <= now();
  
  return coalesce(streak_count, 0);
end;
$$;