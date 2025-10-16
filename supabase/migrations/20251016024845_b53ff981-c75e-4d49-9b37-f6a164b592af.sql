-- Create secure key-value storage for API keys
create table if not exists public.secure_kv (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Enable RLS to prevent direct access
alter table public.secure_kv enable row level security;

-- Deny all direct access - only service role can read
create policy "deny_all_select_secure_kv"
on public.secure_kv for select using (false);

create policy "deny_all_insert_secure_kv"
on public.secure_kv for insert with check (false);

create policy "deny_all_update_secure_kv"
on public.secure_kv for update using (false);

create policy "deny_all_delete_secure_kv"
on public.secure_kv for delete using (false);