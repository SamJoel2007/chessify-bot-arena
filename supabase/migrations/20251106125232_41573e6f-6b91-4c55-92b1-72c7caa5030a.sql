-- Function to update user points
CREATE OR REPLACE FUNCTION public.update_user_points(user_id uuid, points_change integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET points = GREATEST(0, points + points_change)
  WHERE id = user_id;
END;
$$;