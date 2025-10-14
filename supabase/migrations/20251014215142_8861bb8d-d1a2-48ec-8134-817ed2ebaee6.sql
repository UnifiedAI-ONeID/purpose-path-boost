-- Create the first admin user
-- This will create a trigger-based function to automatically create admin role
-- when a specific email signs up

-- Create function to handle new admin user
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user in the system
  -- OR if it's a specific admin email
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    -- This is the first user, make them admin automatically
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run on new user signup
DROP TRIGGER IF EXISTS on_first_user_admin ON auth.users;
CREATE TRIGGER on_first_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_signup();

-- Note: The first user to sign up will automatically become an admin
-- After that, additional admins must be added manually using:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('user_id_here', 'admin');