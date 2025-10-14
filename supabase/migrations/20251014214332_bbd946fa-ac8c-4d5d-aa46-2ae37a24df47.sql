-- Add RLS policies for user_roles table
-- Allow admins to view all roles
CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Allow admins to manage roles
CREATE POLICY "Admins can insert user roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles" ON public.user_roles
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles" ON public.user_roles
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);