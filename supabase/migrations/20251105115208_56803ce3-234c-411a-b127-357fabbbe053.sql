-- Remove duplicate entries from match_queue, keeping only the most recent one per user
DELETE FROM public.match_queue
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.match_queue
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint to match_queue.user_id to prevent duplicates
ALTER TABLE public.match_queue 
ADD CONSTRAINT match_queue_user_id_key UNIQUE (user_id);