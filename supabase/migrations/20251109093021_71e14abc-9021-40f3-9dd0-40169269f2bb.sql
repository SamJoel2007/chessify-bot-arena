-- Add registration_slug to tournaments table
ALTER TABLE public.tournaments
ADD COLUMN registration_slug text UNIQUE;

-- Add tournament_id to games table to link games to tournaments
ALTER TABLE public.games
ADD COLUMN tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL;

-- Create tournament_matches table for managing pairings
CREATE TABLE public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round_number integer NOT NULL,
  player1_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  player2_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  player1_username text NOT NULL,
  player2_username text NOT NULL,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  winner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create tournament_standings table for tracking results
CREATE TABLE public.tournament_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username text NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  rank integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_standings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_matches
CREATE POLICY "Anyone can view tournament matches"
ON public.tournament_matches FOR SELECT USING (true);

CREATE POLICY "System can insert tournament matches"
ON public.tournament_matches FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update tournament matches"
ON public.tournament_matches FOR UPDATE USING (true);

-- RLS Policies for tournament_standings
CREATE POLICY "Anyone can view tournament standings"
ON public.tournament_standings FOR SELECT USING (true);

CREATE POLICY "System can insert tournament standings"
ON public.tournament_standings FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update tournament standings"
ON public.tournament_standings FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_tournament_matches_updated_at
BEFORE UPDATE ON public.tournament_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_standings_updated_at
BEFORE UPDATE ON public.tournament_standings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();