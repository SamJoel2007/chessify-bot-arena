-- Enable full row data for realtime updates on games table
ALTER TABLE public.games REPLICA IDENTITY FULL;