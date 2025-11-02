-- Create match_queue table for matchmaking
CREATE TABLE IF NOT EXISTS public.match_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  current_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 minutes')
);

-- Create games table for active matches
CREATE TABLE IF NOT EXISTS public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  white_player_id UUID NOT NULL,
  black_player_id UUID NOT NULL,
  white_username TEXT NOT NULL,
  black_username TEXT NOT NULL,
  white_avatar TEXT,
  black_avatar TEXT,
  current_fen TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  white_time_remaining INTEGER NOT NULL DEFAULT 600,
  black_time_remaining INTEGER NOT NULL DEFAULT 600,
  current_turn TEXT NOT NULL DEFAULT 'w',
  status TEXT NOT NULL DEFAULT 'active',
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_moves table for move history
CREATE TABLE IF NOT EXISTS public.game_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  move_san TEXT NOT NULL,
  fen_after TEXT NOT NULL,
  player_id UUID NOT NULL,
  time_taken INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_queue
CREATE POLICY "Users can view all match queue entries"
  ON public.match_queue FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own queue entry"
  ON public.match_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entry"
  ON public.match_queue FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for games
CREATE POLICY "Users can view their own games"
  ON public.games FOR SELECT
  USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

CREATE POLICY "Users can update their own games"
  ON public.games FOR UPDATE
  USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

CREATE POLICY "System can insert games"
  ON public.games FOR INSERT
  WITH CHECK (true);

-- RLS Policies for game_moves
CREATE POLICY "Users can view moves from their games"
  ON public.game_moves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_moves.game_id
      AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert moves in their games"
  ON public.game_moves FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_moves.game_id
      AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_moves;

-- Create function to clean up expired queue entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM public.match_queue
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_match_queue_created_at ON public.match_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_games_players ON public.games(white_player_id, black_player_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_game_id ON public.game_moves(game_id);