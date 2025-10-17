-- Fix 1: Enable RLS on secrets table and add admin-only policies
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read secrets"
  ON public.secrets
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Only admins can manage secrets"
  ON public.secrets
  FOR ALL
  USING (is_admin());

-- Fix 2: Tighten admin table RLS policy - only admins can view admin list
DROP POLICY IF EXISTS "Admins can read admin list" ON public.zg_admins;

CREATE POLICY "Only admins can read admin list"
  ON public.zg_admins
  FOR SELECT
  USING (is_admin());