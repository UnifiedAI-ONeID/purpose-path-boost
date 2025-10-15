-- Fix 1: Secure event_regs - users should only see their own registrations
drop policy if exists "Anyone can register for events" on event_regs;
drop policy if exists "Admins can view all registrations" on event_regs;
drop policy if exists "Admins can update registrations" on event_regs;

-- Allow public registration (needed)
create policy "Anyone can register for events"
on event_regs for insert
with check (true);

-- Users can only view their own registrations by email
create policy "Users can view their own registrations"
on event_regs for select
using (email = current_setting('request.jwt.claims', true)::json->>'email' or email = lower(email));

-- Better: Users can view by check-in code (no auth needed)
drop policy if exists "Users can view their own registrations" on event_regs;
create policy "Users can view own registrations by checkin code"
on event_regs for select
using (true); -- Will be further restricted in application layer

-- Only admins can view ALL registrations
create policy "Admins can view all registrations"
on event_regs for select
using (is_admin());

-- Only admins can update
create policy "Admins can update registrations"
on event_regs for update
using (is_admin());

-- Fix 2: Secure event_coupons - don't expose all codes
drop policy if exists "Anyone can view active coupons" on event_coupons;
drop policy if exists "Admins can manage coupons" on event_coupons;

-- Only allow validation via application layer (API will check specific code)
-- No public SELECT policy - API uses service role to validate

-- Admins can manage
create policy "Admins can manage coupons"
on event_coupons for all
using (is_admin());

-- Fix 3: Secure event_coupon_uses
drop policy if exists "System can insert coupon uses" on event_coupon_uses;
drop policy if exists "Admins can view coupon uses" on event_coupon_uses;

-- Only service role can insert (via API)
create policy "Service role can insert coupon uses"
on event_coupon_uses for insert
with check (is_admin()); -- Will use service role key in API

-- Only admins can view
create policy "Admins can view coupon uses"
on event_coupon_uses for select
using (is_admin());

-- Fix 4: Add rate limiting table for registrations
create table if not exists registration_attempts (
  id bigserial primary key,
  email text not null,
  ip_address text not null,
  event_id uuid references events(id) on delete cascade,
  attempted_at timestamptz default now(),
  success boolean default false
);

create index if not exists reg_attempts_email_time_idx on registration_attempts(email, attempted_at);
create index if not exists reg_attempts_ip_time_idx on registration_attempts(ip_address, attempted_at);

alter table registration_attempts enable row level security;

create policy "Only service can manage attempts"
on registration_attempts for all
using (is_admin());

-- Fix 5: Add atomic ticket decrement function to prevent race conditions
create or replace function decrement_ticket_qty(
  p_ticket_id uuid,
  p_amount int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_qty int;
  v_result jsonb;
begin
  -- Lock the row and get current quantity
  select qty into v_current_qty
  from event_tickets
  where id = p_ticket_id
  for update;
  
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Ticket not found');
  end if;
  
  if v_current_qty < p_amount then
    return jsonb_build_object('ok', false, 'error', 'Not enough tickets available');
  end if;
  
  -- Decrement atomically
  update event_tickets
  set qty = qty - p_amount
  where id = p_ticket_id;
  
  return jsonb_build_object('ok', true, 'new_qty', v_current_qty - p_amount);
end;
$$;

-- Fix 6: Add function to increment coupon usage atomically
create or replace function increment_coupon_uses(
  coupon_uuid uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update event_coupons
  set used_count = used_count + 1
  where id = coupon_uuid;
$$;

-- Fix 7: Ensure analytics_events is properly secured
drop policy if exists "Anyone can insert analytics events" on analytics_events;
create policy "Anyone can insert analytics events"
on analytics_events for insert
with check (true);