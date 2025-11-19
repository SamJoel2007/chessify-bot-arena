import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

        toast({
          title: "🎉 Quest Complete!",
          description: `${quest.title} - +${quest.reward_coins} coins earned!`,
        });
      }
    }
  } catch (error) {
    console.error('Error updating quest progress:', error);
  }
};
