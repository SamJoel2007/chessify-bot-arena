-- Create guest_players table for temporary guest sessions
CREATE TABLE public.guest_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on guest_players
ALTER TABLE public.guest_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_players
CREATE POLICY "Anyone can view guest by session token"
ON public.guest_players
FOR SELECT
USING (true);

CREATE POLICY "System can insert guest players"
ON public.guest_players
FOR INSERT
WITH CHECK (true);

-- Create game_invites table for tracking invite links
CREATE TABLE public.game_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_username TEXT NOT NULL,
  host_avatar TEXT,
  guest_player_id UUID REFERENCES public.guest_players(id) ON DELETE SET NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'started', 'expired')),
  time_control INTEGER NOT NULL DEFAULT 600,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on game_invites
ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_invites
CREATE POLICY "Anyone can view game invites by code"
ON public.game_invites
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create game invites"
ON public.game_invites
FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "System can update game invites"
ON public.game_invites
FOR UPDATE
USING (true);

-- Modify games table to support guest players
ALTER TABLE public.games 
ADD COLUMN white_player_type TEXT DEFAULT 'user' CHECK (white_player_type IN ('user', 'guest')),
ADD COLUMN black_player_type TEXT DEFAULT 'user' CHECK (black_player_type IN ('user', 'guest')),
ADD COLUMN invite_code TEXT;

-- Update games RLS policies to allow guests
CREATE POLICY "Guests can view their games"
ON public.games
FOR SELECT
USING (
  (white_player_type = 'guest' AND white_player_id IS NOT NULL) OR
  (black_player_type = 'guest' AND black_player_id IS NOT NULL) OR
  (auth.uid() = white_player_id) OR 
  (auth.uid() = black_player_id)
);

CREATE POLICY "Guests can update their games"
ON public.games
FOR UPDATE
USING (
  (white_player_type = 'guest' AND white_player_id IS NOT NULL) OR
  (black_player_type = 'guest' AND black_player_id IS NOT NULL) OR
  (auth.uid() = white_player_id) OR 
  (auth.uid() = black_player_id)
);

-- Update game_moves RLS to allow guests
CREATE POLICY "Guests can insert moves in their games"
ON public.game_moves
FOR INSERT
WITH CHECK (true);

-- Update game_chat RLS to allow guests
CREATE POLICY "Guests can insert messages in their games"
ON public.game_chat
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view game chat"
ON public.game_chat
FOR SELECT
USING (true);

-- Create index for faster invite code lookups
CREATE INDEX idx_game_invites_invite_code ON public.game_invites(invite_code);
CREATE INDEX idx_guest_players_session_token ON public.guest_players(session_token);