-- Create events table to manage event timing and status
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time timestamp with time zone,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'ongoing', 'completed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view events
CREATE POLICY "Anyone can view events"
ON public.events
FOR SELECT
USING (true);

-- Only admins can update events
CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert events
CREATE POLICY "Admins can insert events"
ON public.events
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert the Winter ARC Chess event
INSERT INTO public.events (name, status)
VALUES ('Winter ARC Chess', 'not_started')
ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();