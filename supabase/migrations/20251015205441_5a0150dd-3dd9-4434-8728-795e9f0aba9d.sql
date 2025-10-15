-- Add tags tracking to social_posts
alter table social_posts add column if not exists tags text[] default '{}';
alter table social_posts add column if not exists primary_tag text;

-- backfill primary_tag from tags[1] if empty
update social_posts set primary_tag = (case when array_length(tags,1) >= 1 then tags[1] else null end)
where primary_tag is null;

create index if not exists social_posts_primary_tag_idx on social_posts (primary_tag);

-- Create view for tag performance analytics
create or replace view v_tag_performance as
select
  sp.primary_tag as tag,
  date_trunc('week', sm.captured_at)::date as week_start,
  count(distinct sp.id) as post_count,
  sum(coalesce(sm.impressions,0)) as impressions,
  sum(coalesce(sm.likes,0) + coalesce(sm.comments,0) + coalesce(sm.shares,0) + coalesce(sm.saves,0)) as engagements,
  sum(coalesce(sm.clicks,0)) as clicks,
  sum(coalesce(sm.video_views,0)) as video_views,
  -- Engagement Rate %
  case when sum(coalesce(sm.impressions,0)) > 0
    then round( (sum(coalesce(sm.likes,0) + coalesce(sm.comments,0) + coalesce(sm.shares,0) + coalesce(sm.saves,0))::numeric) 
                / sum(coalesce(sm.impressions,0)) * 100, 2)
    else 0 end as er_pct,
  -- Click-through Rate %
  case when sum(coalesce(sm.impressions,0)) > 0 and sum(coalesce(sm.clicks,0)) > 0
    then round( (sum(coalesce(sm.clicks,0))::numeric) / sum(coalesce(sm.impressions,0)) * 100, 2)
    else null end as ctr_pct
from social_metrics sm
join social_posts sp on sp.platform_post_id = sm.platform_post_id
where sp.primary_tag is not null and sp.status='posted'
group by 1,2
order by 2 desc, 1;