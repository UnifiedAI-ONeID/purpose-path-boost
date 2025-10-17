-- Add simon.luke@unswalumni.com as admin
INSERT INTO public.zg_admins (user_id, email)
SELECT id, email FROM auth.users
WHERE email = 'simon.luke@unswalumni.com'
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;