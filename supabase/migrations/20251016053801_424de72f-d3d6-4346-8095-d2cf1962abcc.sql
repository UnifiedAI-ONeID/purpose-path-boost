-- 0.1 user profiles (anonymous by device until email known)
create table if not exists zg_profiles (
  id uuid primary key default gen_random_uuid(),
  device_id text unique,
  email text,
  name text,
  locale text default 'en',
  created_at timestamptz default now()
);

alter table zg_profiles enable row level security;

create policy "Anyone can create profiles"
  on zg_profiles for insert
  with check (true);

create policy "Anyone can view own profile by device"
  on zg_profiles for select
  using (true);

create policy "Anyone can update own profile by device"
  on zg_profiles for update
  using (true);

-- 0.2 onboarding quiz: questions & choices
create table if not exists zg_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  order_no int,
  key text unique,
  title_en text,
  title_zh_cn text,
  title_zh_tw text,
  active boolean default true
);

alter table zg_quiz_questions enable row level security;

create policy "Anyone can view active quiz questions"
  on zg_quiz_questions for select
  using (active = true);

create policy "Admins can manage quiz questions"
  on zg_quiz_questions for all
  using (is_admin());

create table if not exists zg_quiz_choices (
  id uuid primary key default gen_random_uuid(),
  question_key text references zg_quiz_questions(key) on delete cascade,
  value text,
  label_en text,
  label_zh_cn text,
  label_zh_tw text,
  tag text
);

alter table zg_quiz_choices enable row level security;

create policy "Anyone can view quiz choices"
  on zg_quiz_choices for select
  using (true);

create policy "Admins can manage quiz choices"
  on zg_quiz_choices for all
  using (is_admin());

-- 0.3 answers
create table if not exists zg_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references zg_profiles(id) on delete set null,
  device_id text,
  question_key text,
  choice_value text,
  created_at timestamptz default now()
);

alter table zg_quiz_answers enable row level security;

create policy "Anyone can insert quiz answers"
  on zg_quiz_answers for insert
  with check (true);

create policy "Admins can view all quiz answers"
  on zg_quiz_answers for select
  using (is_admin());

-- 0.4 offer tags (for recommendations)
alter table coaching_offers add column if not exists tags text[];

-- 0.5 telemetry (event stream)
create table if not exists zg_events (
  id uuid primary key default gen_random_uuid(),
  device_id text,
  profile_id uuid,
  event text,
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists zg_events_event_idx on zg_events(event);
create index if not exists zg_events_device_idx on zg_events(device_id);
create index if not exists zg_events_created_idx on zg_events(created_at);

alter table zg_events enable row level security;

create policy "Anyone can insert events"
  on zg_events for insert
  with check (true);

create policy "Admins can view all events"
  on zg_events for select
  using (is_admin());

-- 0.6 referrals
create table if not exists zg_referrals (
  id uuid primary key default gen_random_uuid(),
  ref_code text unique,
  profile_id uuid references zg_profiles(id) on delete set null,
  clicks int default 0,
  conversions int default 0,
  created_at timestamptz default now()
);

alter table zg_referrals enable row level security;

create policy "Anyone can view referrals"
  on zg_referrals for select
  using (true);

create policy "Anyone can insert referrals"
  on zg_referrals for insert
  with check (true);

create policy "Service can update referrals"
  on zg_referrals for update
  using (true);

-- 0.7 i18n translations cache
create table if not exists i18n_translations (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  source_hash text not null,
  source_lang text not null,
  target_lang text not null,
  source_text text not null,
  translated_text text not null,
  updated_at timestamptz default now(),
  unique(scope, source_hash, target_lang)
);

alter table i18n_translations enable row level security;

create policy "Anyone can view translations"
  on i18n_translations for select
  using (true);

create policy "Service can manage translations"
  on i18n_translations for all
  using (true);