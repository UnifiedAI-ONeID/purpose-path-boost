-- Express offers and orders tables
create table if not exists express_offers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  base_currency text not null default 'USD',
  base_price_cents int not null default 9900,
  active boolean default true
);

create table if not exists express_price_overrides (
  id uuid primary key default gen_random_uuid(),
  offer_slug text references express_offers(slug) on delete cascade,
  currency text not null,
  price_cents int not null,
  unique(offer_slug, currency)
);

create table if not exists express_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  offer_slug text not null,
  name text not null,
  email text not null,
  language text,
  notes text,
  currency text not null,
  amount_cents int not null,
  status text not null default 'pending',
  airwallex_id text,
  airwallex_link text
);

create index if not exists express_orders_email_idx on express_orders(email);

-- RLS policies
alter table express_offers enable row level security;
alter table express_price_overrides enable row level security;
alter table express_orders enable row level security;

create policy "Anyone can view active offers" on express_offers for select using (active = true);
create policy "Admins can manage offers" on express_offers for all using (is_admin());

create policy "Anyone can view price overrides" on express_price_overrides for select using (true);
create policy "Admins can manage price overrides" on express_price_overrides for all using (is_admin());

create policy "Anyone can create orders" on express_orders for insert with check (true);
create policy "Admins can view all orders" on express_orders for select using (is_admin());
create policy "Admins can update orders" on express_orders for update using (is_admin());

-- Seed default offer
insert into express_offers (slug, title, description, base_currency, base_price_cents, active)
values ('priority-30','30-min Priority Consult','48-hour response SLA, laser-focused action plan.','USD',9900,true)
on conflict (slug) do nothing;