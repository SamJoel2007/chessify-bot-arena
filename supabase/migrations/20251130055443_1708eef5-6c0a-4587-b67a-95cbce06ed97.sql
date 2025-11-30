-- Update RLS policy to allow users to insert draft or pending review posts
DROP POLICY IF EXISTS "Users can insert draft posts" ON public.blog_posts;

CREATE POLICY "Users can insert draft or pending posts"
ON public.blog_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id AND status IN ('draft', 'pending_review')
);

-- Update the user update policy to allow updating pending_review posts too
DROP POLICY IF EXISTS "Users can update their own drafts" ON public.blog_posts;

CREATE POLICY "Users can update their own drafts or pending posts"
ON public.blog_posts
FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid() AND status IN ('draft', 'pending_review')
);