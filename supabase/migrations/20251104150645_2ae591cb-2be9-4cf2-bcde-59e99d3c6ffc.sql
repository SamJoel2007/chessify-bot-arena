-- Create game_chat table for in-game messaging
CREATE TABLE IF NOT EXISTS public.game_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_chat ENABLE ROW LEVEL SECURITY;

-- Users can view messages from their games
CREATE POLICY "Users can view messages from their games"
  ON public.game_chat
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_chat.game_id
      AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    )
  );

-- Users can insert messages in their games
CREATE POLICY "Users can insert messages in their games"
  ON public.game_chat
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_chat.game_id
      AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_game_chat_game_id ON public.game_chat(game_id);
CREATE INDEX IF NOT EXISTS idx_game_chat_created_at ON public.game_chat(created_at);

-- Enable realtime for game_chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_chat;