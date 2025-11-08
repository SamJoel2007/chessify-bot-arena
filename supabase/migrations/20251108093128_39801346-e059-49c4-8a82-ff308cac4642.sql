-- Drop the existing find_match function
DROP FUNCTION IF EXISTS public.find_match(uuid, text, text);

-- Create updated find_match function with time_control parameter
CREATE OR REPLACE FUNCTION public.find_match(
  p_user_id uuid,
  p_username text,
  p_current_avatar text,
  p_time_control integer DEFAULT 600
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_opponent record;
  v_game_id uuid;
  v_is_white boolean;
BEGIN
  -- Find oldest waiting opponent with same time control (excluding current user)
  SELECT * INTO v_opponent
  FROM public.match_queue
  WHERE user_id != p_user_id
    AND time_control = p_time_control
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- If no opponent found, add current user to queue
  IF v_opponent IS NULL THEN
    -- Insert or update current user in queue with time control
    INSERT INTO public.match_queue (user_id, username, current_avatar, time_control)
    VALUES (p_user_id, p_username, p_current_avatar, p_time_control)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      username = EXCLUDED.username,
      current_avatar = EXCLUDED.current_avatar,
      time_control = EXCLUDED.time_control,
      created_at = now();
    
    RETURN jsonb_build_object('status', 'waiting');
  END IF;
  
  -- Match found! Randomly assign colors
  v_is_white := random() < 0.5;
  
  -- Create game with matched time control
  INSERT INTO public.games (
    white_player_id,
    black_player_id,
    white_username,
    black_username,
    white_avatar,
    black_avatar,
    white_time_remaining,
    black_time_remaining
  ) VALUES (
    CASE WHEN v_is_white THEN p_user_id ELSE v_opponent.user_id END,
    CASE WHEN v_is_white THEN v_opponent.user_id ELSE p_user_id END,
    CASE WHEN v_is_white THEN p_username ELSE v_opponent.username END,
    CASE WHEN v_is_white THEN v_opponent.username ELSE p_username END,
    CASE WHEN v_is_white THEN p_current_avatar ELSE v_opponent.current_avatar END,
    CASE WHEN v_is_white THEN v_opponent.current_avatar ELSE p_current_avatar END,
    p_time_control,
    p_time_control
  )
  RETURNING id INTO v_game_id;
  
  -- Remove both players from queue
  DELETE FROM public.match_queue
  WHERE user_id IN (p_user_id, v_opponent.user_id);
  
  -- Return success with game_id
  RETURN jsonb_build_object(
    'status', 'matched',
    'game_id', v_game_id,
    'opponent', jsonb_build_object(
      'user_id', v_opponent.user_id,
      'username', v_opponent.username,
      'avatar', v_opponent.current_avatar
    )
  );
END;
$function$;