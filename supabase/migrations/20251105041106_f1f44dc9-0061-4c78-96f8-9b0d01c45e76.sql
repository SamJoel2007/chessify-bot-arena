-- Allow all authenticated users to view basic profile info of other users
-- This enables friend search and displaying friend information
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');