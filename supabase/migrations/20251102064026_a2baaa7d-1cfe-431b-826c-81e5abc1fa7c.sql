-- Fix search_path for cleanup function
DROP FUNCTION IF EXISTS public.cleanup_expired_queue_entries();

CREATE OR REPLACE FUNCTION public.cleanup_expired_queue_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.match_queue
  WHERE expires_at < now();
END;
$$;