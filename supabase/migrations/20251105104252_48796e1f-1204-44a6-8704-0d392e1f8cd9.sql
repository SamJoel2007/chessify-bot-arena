-- Fix user_roles RLS policy to prevent enumeration of admin accounts
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create a restricted policy that only allows users to view their own role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a security definer function for admins to query other users' roles
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = target_user_id 
    AND has_role(auth.uid(), 'admin'::app_role)
  LIMIT 1;
$$;