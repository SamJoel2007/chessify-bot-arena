-- Create game_draw_offers table
CREATE TABLE game_draw_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  offered_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Enable RLS
ALTER TABLE game_draw_offers ENABLE ROW LEVEL SECURITY;

-- Players in the game can view draw offers
CREATE POLICY "Players can view draw offers"
  ON game_draw_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_draw_offers.game_id
      AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    )
  );

-- Players can create draw offers in their games
CREATE POLICY "Players can create draw offers"
  ON game_draw_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_draw_offers.game_id
      AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
      AND games.status = 'active'
    )
  );

-- Players can update draw offers (to accept/decline)
CREATE POLICY "Players can update draw offers"
  ON game_draw_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_draw_offers.game_id
      AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    )
  );

-- Enable realtime for draw offers
ALTER PUBLICATION supabase_realtime ADD TABLE game_draw_offers;

-- Add last_move_at column to games table
ALTER TABLE games ADD COLUMN last_move_at TIMESTAMPTZ DEFAULT now();