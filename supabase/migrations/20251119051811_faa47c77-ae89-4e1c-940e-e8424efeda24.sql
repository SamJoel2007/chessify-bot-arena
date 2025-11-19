-- Create daily_quests table
CREATE TABLE public.daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_count integer NOT NULL,
  reward_coins integer NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_quest_progress table
CREATE TABLE public.user_quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_type text NOT NULL,
  current_count integer DEFAULT 0,
  completed boolean DEFAULT false,
  last_reset_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quest_type, last_reset_date)
);

-- Enable RLS
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_quests
CREATE POLICY "Anyone can view daily quests"
ON public.daily_quests
FOR SELECT
USING (true);

CREATE POLICY "System can insert daily quests"
ON public.daily_quests
FOR INSERT
WITH CHECK (true);

-- RLS Policies for user_quest_progress
CREATE POLICY "Users can view their own quest progress"
ON public.user_quest_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest progress"
ON public.user_quest_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest progress"
ON public.user_quest_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Seed default quests
INSERT INTO public.daily_quests (quest_type, title, description, target_count, reward_coins, icon) VALUES
  ('play_online', 'Online Warrior', 'Play 3 online games', 3, 20, '🎮'),
  ('play_bullet', 'Speed Demon', 'Play 2 bullet games (1 min)', 2, 15, '⚡'),
  ('play_bot', 'Bot Slayer', 'Defeat 1 bot', 1, 10, '🤖'),
  ('spin_wheel', 'Lucky Spin', 'Spin the lucky wheel', 1, 10, '🎰');