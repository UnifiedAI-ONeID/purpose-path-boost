-- Coupon system for events
create table if not exists event_coupons (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  code text not null,                       -- e.g., GROWTH20 (case-insensitive)
  discount_type text not null check (discount_type in ('percent','amount')),
  discount_value numeric not null,         -- percent: 1..100 ; amount: cents
  currency text default 'USD',             -- only for amount type
  starts_at timestamptz default now(),
  expires_at timestamptz,
  max_uses int default 0,                  -- 0 = unlimited
  per_user_limit int default 1,
  applies_to_all boolean default true,     -- or scope to tickets[]
  tickets uuid[] default '{}',             -- optional: specific ticket_ids
  active boolean default true,
  used_count int default 0,
  created_at timestamptz default now(),
  unique(event_id, code)
);

-- Enable RLS
alter table event_coupons enable row level security;

-- Anyone can view active coupons
create policy "Anyone can view active coupons"
on event_coupons for select
using (active = true);

-- Admins can manage coupons
create policy "Admins can manage coupons"
on event_coupons for all
using (is_admin());

-- Track per-user redemptions
create table if not exists event_coupon_uses (
  id bigserial primary key,
  coupon_id uuid references event_coupons(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  email text not null,
  reg_id uuid references event_regs(id) on delete set null,
  used_at timestamptz default now()
);
create index if not exists ecu_coupon_email_idx on event_coupon_uses (coupon_id, email);

-- Enable RLS
alter table event_coupon_uses enable row level security;

-- Admins can view all uses
create policy "Admins can view coupon uses"
on event_coupon_uses for select
using (is_admin());

-- System can insert uses
create policy "System can insert coupon uses"
on event_coupon_uses for insert
with check (true);

-- Waitlist offer tokens
alter table event_regs add column if not exists offer_token text;
alter table event_regs add column if not exists offer_expires_at timestamptz;
alter table event_regs add column if not exists offer_sent_at timestamptz;
alter table event_regs add column if not exists coupon_code text;
alter table event_regs add column if not exists discount_cents int default 0;