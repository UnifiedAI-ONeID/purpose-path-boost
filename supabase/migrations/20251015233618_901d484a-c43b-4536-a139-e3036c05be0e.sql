-- AI logs table for monitoring and debugging
create table if not exists ai_logs (
  id bigserial primary key,
  at timestamptz default now(),
  route text not null,
  mode text not null,
  request jsonb,
  error text,
  duration_ms int
);

create index if not exists ai_logs_at_idx on ai_logs(at desc);
create index if not exists ai_logs_route_idx on ai_logs(route);
create index if not exists ai_logs_mode_idx on ai_logs(mode);

-- RLS policies
alter table ai_logs enable row level security;

create policy "Admins can view AI logs" on ai_logs
  for select using (is_admin());

create policy "Anyone can insert AI logs" on ai_logs
  for insert with check (true);