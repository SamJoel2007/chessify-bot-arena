-- Create table to store SEO settings per page
CREATE TABLE public.page_seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text UNIQUE NOT NULL,
  page_name text NOT NULL,
  keywords text[] DEFAULT '{}',
  meta_description text,
  meta_title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_seo_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage SEO settings
CREATE POLICY "Admins can view all SEO settings"
ON public.page_seo_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert SEO settings"
ON public.page_seo_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update SEO settings"
ON public.page_seo_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete SEO settings"
ON public.page_seo_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_page_seo_settings_updated_at
BEFORE UPDATE ON public.page_seo_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default pages
INSERT INTO public.page_seo_settings (page_path, page_name, keywords) VALUES
('/', 'Home', ARRAY['chess', 'chess board', 'chess online', 'chess board setup', 'online chess', 'chess game', 'chess pie', 'how to play chess']),
('/bots', 'Bots', ARRAY['chess AI', 'chess bot', 'play chess against computer']),
('/puzzles', 'Puzzles', ARRAY['chess puzzles', 'mate in 1', 'mate in 2', 'chess tactics']),
('/community', 'Community', ARRAY['chess community', 'chess chat', 'chess forums']),
('/leaderboards', 'Leaderboards', ARRAY['chess leaderboards', 'chess rankings', 'top chess players']),
('/blog', 'Blog', ARRAY['chess blog', 'chess tips', 'chess strategy']),
('/game-history', 'Game History', ARRAY['chess game history', 'past chess games']),
('/friends', 'Friends', ARRAY['chess friends', 'play chess with friends']),
('/coach', 'Coach', ARRAY['AI chess coach', 'learn chess online', 'chess lessons']);