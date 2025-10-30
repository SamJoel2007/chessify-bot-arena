-- Add coins to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 1000;

-- Create purchases table to track what users bought
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id text NOT NULL,
  item_name text NOT NULL,
  item_data jsonb,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Add current_avatar to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_avatar text;

-- Enable RLS
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_purchases
CREATE POLICY "Users can view their own purchases"
ON public.user_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.user_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to handle purchase
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
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
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