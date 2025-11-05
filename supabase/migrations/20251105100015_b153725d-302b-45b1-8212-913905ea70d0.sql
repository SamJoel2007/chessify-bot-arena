-- Add rank and points to profiles table
CREATE TYPE public.user_rank AS ENUM ('bronze', 'silver', 'gold', 'diamond', 'platinum');

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS rank public.user_rank NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;