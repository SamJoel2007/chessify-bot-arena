-- Fix 1: Profiles email exposure - restrict profile viewing
-- Drop the overly permissive policy that exposes emails
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create a view for public profile data (excludes email)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, current_avatar, profile_picture_url, rank, points, created_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Create a function to safely get profile data for other users
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  current_avatar text,
  profile_picture_url text,
  rank user_rank,
  points integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.current_avatar, p.profile_picture_url, p.rank, p.points
  FROM public.profiles p
  WHERE p.id = target_user_id;
$$;

-- Create new policy: Users can view limited fields of other profiles (except email)
-- This allows the app to function (find friends, see leaderboards) without exposing emails
CREATE POLICY "Authenticated users can view limited profile data" 
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Users can always see their own complete profile
  auth.uid() = id 
  OR 
  -- Admins can see all profiles
  has_role(auth.uid(), 'admin')
);

-- Fix 2: Tournament system - restrict to admins only
-- Drop the overly permissive tournament policies
DROP POLICY IF EXISTS "Anyone can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Anyone can update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Anyone can delete tournaments" ON public.tournaments;

-- Create admin-only policies for tournaments
CREATE POLICY "Admins can create tournaments" 
ON public.tournaments FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tournaments" 
ON public.tournaments FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tournaments" 
ON public.tournaments FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix tournament_matches - restrict direct access
DROP POLICY IF EXISTS "System can insert tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "System can update tournament matches" ON public.tournament_matches;

-- Create admin-only policies for tournament matches  
CREATE POLICY "Admins can insert tournament matches" 
ON public.tournament_matches FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tournament matches" 
ON public.tournament_matches FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix tournament_standings - restrict direct access
DROP POLICY IF EXISTS "System can insert tournament standings" ON public.tournament_standings;
DROP POLICY IF EXISTS "System can update tournament standings" ON public.tournament_standings;

-- Create admin-only policies for tournament standings
CREATE POLICY "Admins can insert tournament standings" 
ON public.tournament_standings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tournament standings" 
ON public.tournament_standings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix tournament_participants - restrict registration properly
DROP POLICY IF EXISTS "Anyone can register" ON public.tournament_participants;
DROP POLICY IF EXISTS "Anyone can remove participants" ON public.tournament_participants;

-- Users can only register themselves
CREATE POLICY "Users can register themselves for tournaments" 
ON public.tournament_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only admins can remove participants
CREATE POLICY "Admins can remove participants" 
ON public.tournament_participants FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));