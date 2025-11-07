-- Safely assign admin role to sam123@gmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find the user ID by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'sam123@gmail.com';
  
  -- If user exists, insert admin role (if not already exists)
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;