-- Add fields to posts table for images and external sources
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS external_url text,
ADD COLUMN IF NOT EXISTS author_username text;

-- Create index for faster filtering by source
CREATE INDEX IF NOT EXISTS idx_posts_source ON public.posts(source);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Update RLS policy to allow anyone to view posts
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts"
ON public.posts
FOR SELECT
USING (true);

-- Allow authenticated users to create posts
DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
CREATE POLICY "Users can insert posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = author_id);