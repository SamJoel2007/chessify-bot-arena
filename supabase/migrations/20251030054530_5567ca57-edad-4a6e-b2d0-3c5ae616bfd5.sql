-- Ensure all auth users have profiles
INSERT INTO public.profiles (id, email, username, coins)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)) as username,
  1000 as coins
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Update the handle_purchase function to be more robust
CREATE OR REPLACE FUNCTION public.handle_purchase(
  p_item_type text,
  p_item_id text,
  p_item_name text,
  p_item_data jsonb,
  p_price integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_coins integer;
BEGIN
  v_user_id := auth.uid();
  
  -- Ensure profile exists (create if not)
  INSERT INTO public.profiles (id, email, username, coins)
  SELECT 
    v_user_id,
    (SELECT email FROM auth.users WHERE id = v_user_id),
    (SELECT COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)) FROM auth.users WHERE id = v_user_id),
    1000
  ON CONFLICT (id) DO NOTHING;
  
  -- Get current coins
  SELECT coins INTO v_current_coins
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Check if user has enough coins
  IF v_current_coins < p_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough coins');
  END IF;
  
  -- Check if already purchased
  IF EXISTS (
    SELECT 1 FROM public.user_purchases
    WHERE user_id = v_user_id AND item_type = p_item_type AND item_id = p_item_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already purchased');
  END IF;
  
  -- Deduct coins
  UPDATE public.profiles
  SET coins = coins - p_price
  WHERE id = v_user_id;
  
  -- Insert purchase
  INSERT INTO public.user_purchases (user_id, item_type, item_id, item_name, item_data)
  VALUES (v_user_id, p_item_type, p_item_id, p_item_name, p_item_data);
  
  -- If avatar, set as current
  IF p_item_type = 'avatar' THEN
    UPDATE public.profiles
    SET current_avatar = p_item_id
    WHERE id = v_user_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'coins', v_current_coins - p_price);
END;
$$;