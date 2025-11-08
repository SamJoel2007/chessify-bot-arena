-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  max_participants integer,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Anyone can view tournaments
CREATE POLICY "Anyone can view tournaments"
ON public.tournaments
FOR SELECT
USING (true);

-- Anyone can insert tournaments (since admin security is not required per user request)
CREATE POLICY "Anyone can create tournaments"
ON public.tournaments
FOR INSERT
WITH CHECK (true);

-- Anyone can update tournaments
CREATE POLICY "Anyone can update tournaments"
ON public.tournaments
FOR UPDATE
USING (true);

-- Anyone can delete tournaments
CREATE POLICY "Anyone can delete tournaments"
ON public.tournaments
FOR DELETE
USING (true);

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can view participants
CREATE POLICY "Anyone can view participants"
ON public.tournament_participants
FOR SELECT
USING (true);

-- Anyone can register for tournaments
CREATE POLICY "Anyone can register"
ON public.tournament_participants
FOR INSERT
WITH CHECK (true);

-- Anyone can remove participants
CREATE POLICY "Anyone can remove participants"
ON public.tournament_participants
FOR DELETE
USING (true);