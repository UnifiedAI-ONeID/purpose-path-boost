-- Integration settings (public readable)
create table if not exists integration_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Encrypted secrets (service role only)
create table if not exists integration_secrets (
  key text primary key,
  cipher_b64 text not null,
  iv_b64 text not null,
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table integration_settings enable row level security;
create policy "public_read_integration_settings" on integration_settings
  for select using (true);

alter table integration_secrets enable row level security;
-- No public policies - service role only

-- Seed defaults
insert into integration_settings(key, value) values
('calcom', jsonb_build_object(
  'handle', 'zhengrowth',
  'eventType', 'clarity-call',
  'theme', 'auto'
)),
('youtube', jsonb_build_object(
  'privacy_mode', true,
  'captions', true,
  'default_lang', 'en'
)),
('cn_video', jsonb_build_object(
  'base_url', 'https://cdn-cn.example.com/lessons'
))
on conflict (key) do nothing;