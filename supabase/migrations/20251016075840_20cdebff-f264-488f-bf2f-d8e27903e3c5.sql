-- Import existing admin users from user_roles to zg_admins
insert into public.zg_admins (user_id, email)
select 
  ur.user_id,
  coalesce(au.email, 'admin@zhengrowth.com') as email
from public.user_roles ur
left join auth.users au on au.id = ur.user_id
where ur.role = 'admin'
on conflict (user_id) do nothing;

-- Update zg_profiles.is_admin flag for all admins
update public.zg_profiles
set is_admin = true
where auth_user_id in (
  select user_id from public.zg_admins
);

-- Also add any admins from the old profiles.is_admin system if it exists
insert into public.zg_admins (user_id, email)
select 
  p.user_id,
  coalesce(au.email, 'admin@zhengrowth.com') as email
from public.profiles p
left join auth.users au on au.id = p.user_id
where p.is_admin = true
on conflict (user_id) do nothing;

-- Update zg_profiles for these admins too
update public.zg_profiles
set is_admin = true
where auth_user_id in (
  select user_id from public.profiles where is_admin = true
);