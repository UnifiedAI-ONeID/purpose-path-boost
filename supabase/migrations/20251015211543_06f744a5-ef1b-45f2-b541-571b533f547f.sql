-- Events and workshops system
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  slug text unique not null,
  title text not null,
  summary text,
  description text,
  cover_url text,
  -- schedule (single or multi-session)
  tz text default 'America/Vancouver',
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,             -- 'online', address, or meeting URL
  meeting_url text,          -- Jitsi/Google Meet/Tencent Meeting
  capacity int default 200,
  is_paid boolean default false,
  status text default 'draft' -- 'draft' | 'published' | 'closed'
);

-- Enable RLS
alter table events enable row level security;

-- Anyone can view published events
create policy "Anyone can view published events"
on events for select
using (status = 'published');

-- Admins can manage all events
create policy "Admins can manage events"
on events for all
using (is_admin());

-- Optional sub-sessions (breakouts, multi-day)
create table if not exists event_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  title text,
  start_at timestamptz not null,
  end_at timestamptz not null
);
create index if not exists es_event_idx on event_sessions(event_id);

-- Enable RLS
alter table event_sessions enable row level security;

-- Anyone can view sessions for published events
create policy "Anyone can view sessions for published events"
on event_sessions for select
using (
  exists (
    select 1 from events
    where events.id = event_sessions.event_id
    and events.status = 'published'
  )
);

-- Admins can manage sessions
create policy "Admins can manage sessions"
on event_sessions for all
using (is_admin());

-- Ticket tiers
create table if not exists event_tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,                -- e.g., "General", "VIP"
  price_cents int not null default 0,
  currency text not null default 'USD',
  qty int not null default 100,      -- inventory
  one_per_user boolean default false
);
create index if not exists et_event_idx on event_tickets(event_id);

-- Enable RLS
alter table event_tickets enable row level security;

-- Anyone can view tickets for published events
create policy "Anyone can view tickets for published events"
on event_tickets for select
using (
  exists (
    select 1 from events
    where events.id = event_tickets.event_id
    and events.status = 'published'
  )
);

-- Admins can manage tickets
create policy "Admins can manage tickets"
on event_tickets for all
using (is_admin());

-- Registrations / Orders
create table if not exists event_regs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  event_id uuid references events(id) on delete cascade,
  ticket_id uuid references event_tickets(id),
  name text not null,
  email text not null,
  country text,
  language text,                      -- 'en' | 'zh-CN' | 'zh-TW'
  amount_cents int not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending', -- 'pending' | 'paid' | 'cancelled' | 'waitlist'
  airwallex_link text,                -- hosted payment page link (if paid)
  airwallex_id text,                  -- intent/order id
  checkin_code text unique,           -- for QR
  checked_in_at timestamptz
);
create index if not exists er_event_idx on event_regs(event_id);
create index if not exists er_email_idx on event_regs(email);

-- Enable RLS
alter table event_regs enable row level security;

-- Anyone can insert registrations
create policy "Anyone can register for events"
on event_regs for insert
with check (true);

-- Admins can view all registrations
create policy "Admins can view all registrations"
on event_regs for select
using (is_admin());

-- Admins can update registrations
create policy "Admins can update registrations"
on event_regs for update
using (is_admin());