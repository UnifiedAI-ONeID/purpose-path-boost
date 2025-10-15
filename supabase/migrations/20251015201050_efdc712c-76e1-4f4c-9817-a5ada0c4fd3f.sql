-- Social identities / channels
create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,             -- 'linkedin' | 'facebook' | 'instagram' | 'x' | 'wechat' | 'red' | 'zhihu' | 'douyin' | 'youtube'
  channel_name text,                  -- e.g., "ZhenGrowth Page"
  external_id text,                   -- page id / org URN / ig business id / twitter user id
  created_at timestamptz default now()
);

-- Outbound posts, one row per platform copy
create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  blog_slug text not null,
  platform text not null,
  status text not null default 'queued', -- 'queued' | 'posted' | 'failed'
  platform_post_id text,                 -- returned id/URN
  message text,                          -- final caption/summary used
  media jsonb,                           -- array of media we uploaded or linked
  scheduled_at timestamptz,              -- optional scheduler
  posted_at timestamptz,
  error text,
  created_at timestamptz default now()
);

-- Normalized metrics snapshot
create table if not exists social_metrics (
  id bigserial primary key,
  platform text not null,
  platform_post_id text not null,
  captured_at timestamptz not null default now(),
  impressions int,
  clicks int,
  likes int,
  comments int,
  shares int,
  saves int,
  video_views int,
  followers int
);

create index if not exists social_posts_blog_slug_idx on social_posts (blog_slug);
create index if not exists social_metrics_lookup_idx on social_metrics (platform, platform_post_id, captured_at desc);

-- Enable RLS
alter table social_accounts enable row level security;
alter table social_posts enable row level security;
alter table social_metrics enable row level security;

-- RLS policies: admin-only access
create policy "Admins can manage social accounts"
  on social_accounts for all
  using (is_admin(auth.uid()));

create policy "Admins can manage social posts"
  on social_posts for all
  using (is_admin(auth.uid()));

create policy "Admins can manage social metrics"
  on social_metrics for all
  using (is_admin(auth.uid()));