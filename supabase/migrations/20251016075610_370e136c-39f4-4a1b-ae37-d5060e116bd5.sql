-- Create admin registry table
create table if not exists public.zg_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.zg_admins enable row level security;

-- Only admins can read the admin list
create policy "Admins can read admin list" 
  on public.zg_admins 
  for select 
  using (user_id = auth.uid());

-- Service role can manage admins
create policy "Service role can manage admins"
  on public.zg_admins
  for all
  using (auth.jwt()->>'role' = 'service_role');

-- Add optional is_admin flag to profiles for convenience
alter table public.zg_profiles 
  add column if not exists is_admin boolean default false;

-- Update the existing is_admin function to check zg_admins table (keep parameter name)
create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 
    from public.zg_admins 
    where user_id = _user_id
  )
$$;