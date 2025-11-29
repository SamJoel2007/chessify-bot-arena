-- Update RLS policies for blog_posts to allow users to create drafts

-- Drop existing admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert blog posts" ON public.blog_posts;

-- Create new policy: Admins can insert published posts directly
CREATE POLICY "Admins can insert published posts"
ON public.blog_posts
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create new policy: Any authenticated user can insert drafts
CREATE POLICY "Users can insert draft posts"
ON public.blog_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id AND status = 'draft'
);

-- Create policy: Users can view their own drafts
CREATE POLICY "Users can view their own drafts"
ON public.blog_posts
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid() OR status = 'published'
);

-- Create policy: Users can update their own drafts
CREATE POLICY "Users can update their own drafts"
ON public.blog_posts
FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid() AND status = 'draft'
);

-- Admins can update any post (keep existing policy logic)
-- This is already covered by "Admins can update their own blog posts" but let's make it clearer
DROP POLICY IF EXISTS "Admins can update their own blog posts" ON public.blog_posts;

CREATE POLICY "Admins can update any post"
ON public.blog_posts
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);
