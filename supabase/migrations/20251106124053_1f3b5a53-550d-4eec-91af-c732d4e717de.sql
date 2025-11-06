-- Create game_challenges table
CREATE TABLE IF NOT EXISTS public.game_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL,
  challenged_id UUID NOT NULL,
  challenger_username TEXT NOT NULL,
  challenged_username TEXT NOT NULL,
  challenger_avatar TEXT,
  challenged_avatar TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  game_id UUID REFERENCES public.games(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Enable RLS
ALTER TABLE public.game_challenges ENABLE ROW LEVEL SECURITY;

-- Users can view challenges they sent or received
CREATE POLICY "Users can view their challenges"
  ON public.game_challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Users can create challenges
CREATE POLICY "Users can create challenges"
  ON public.game_challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

-- Users can update received challenges
CREATE POLICY "Users can update received challenges"
  ON public.game_challenges FOR UPDATE
  USING (auth.uid() = challenged_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_challenges;

-- Function to auto-expire old challenges
CREATE OR REPLACE FUNCTION public.expire_old_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.game_challenges
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$;