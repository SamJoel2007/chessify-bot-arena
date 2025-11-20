import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { playQuestCompleteSound } from "./soundUtils";

export const triggerQuestCompleteCelebration = () => {
  // Play celebration sound
  playQuestCompleteSound();
  
  // Trigger confetti
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
};

export const updateQuestProgress = async (
  userId: string,
  questType: string
) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get quest details
    const { data: quest } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('quest_type', questType)
      .single();

    if (!quest) return;

    // Get or create progress
    const { data: progress } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_type', questType)
      .eq('last_reset_date', today)
      .single();

    if (progress?.completed) {
      return; // Already completed
    }

    const newCount = (progress?.current_count || 0) + 1;
    const isCompleted = newCount >= quest.target_count;

    if (progress) {
      // Update existing progress
      await supabase
        .from('user_quest_progress')
        .update({
          current_count: newCount,
          completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id);
    } else {
      // Create new progress
      await supabase
        .from('user_quest_progress')
        .insert({
          user_id: userId,
          quest_type: questType,
          current_count: newCount,
          completed: isCompleted,
          last_reset_date: today,
        });
    }

    // Award coins if completed
    if (isCompleted) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ coins: profile.coins + quest.reward_coins })
          .eq('id', userId);

        // Trigger celebration
        triggerQuestCompleteCelebration();

        // Dispatch custom event with reward amount
        window.dispatchEvent(new CustomEvent('questComplete', { 
          detail: { amount: quest.reward_coins, title: quest.title }
        }));
      }
    }
  } catch (error) {
    console.error('Error updating quest progress:', error);
  }
};
