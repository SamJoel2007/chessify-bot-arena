import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Coins } from "lucide-react";
import { QuestCoinReward } from "./QuestCoinReward";

interface Quest {
  id: string;
  quest_type: string;
  title: string;
  description: string;
  target_count: number;
  reward_coins: number;
  icon: string;
}

interface QuestProgress {
  quest_type: string;
  current_count: number;
  completed: boolean;
}

export const DailyQuests = ({ userId }: { userId: string | undefined }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<Map<string, QuestProgress>>(new Map());
  const [showReward, setShowReward] = useState<{ amount: number; title: string } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchQuestsAndProgress = async () => {
      const today = new Date().toISOString().split('T')[0];

      // Fetch quests
      const { data: questsData } = await supabase
        .from('daily_quests')
        .select('*');

      if (questsData) {
        setQuests(questsData);
      }

      // Fetch progress
      const { data: progressData } = await supabase
        .from('user_quest_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('last_reset_date', today);

      if (progressData) {
        const progressMap = new Map(
          progressData.map(p => [p.quest_type, p])
        );
        setProgress(progressMap);
      }
    };

    fetchQuestsAndProgress();

    // Subscribe to progress updates
    const channel = supabase
      .channel('quest_progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_quest_progress',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchQuestsAndProgress();
        }
      )
      .subscribe();

    // Listen for quest completion events
    const handleQuestComplete = (event: any) => {
      setShowReward({ amount: event.detail.amount, title: event.detail.title });
    };

    window.addEventListener('questComplete', handleQuestComplete);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('questComplete', handleQuestComplete);
    };
  }, [userId]);

  const completedCount = Array.from(progress.values()).filter(p => p.completed).length;
  const totalCoins = quests.reduce((sum, quest) => {
    const p = progress.get(quest.quest_type);
    return sum + (p?.completed ? quest.reward_coins : 0);
  }, 0);

  if (!userId) return null;

  return (
    <>
      {showReward && (
        <QuestCoinReward
          amount={showReward.amount}
          onComplete={() => setShowReward(null)}
        />
      )}
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            ⭐ Daily Quests
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {completedCount}/{quests.length} Complete
            </Badge>
            {totalCoins > 0 && (
              <Badge variant="default" className="text-sm flex items-center gap-1">
                <Coins className="w-3 h-3" />
                +{totalCoins}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {quests.map((quest) => {
            const questProgress = progress.get(quest.quest_type);
            const currentCount = questProgress?.current_count || 0;
            const isCompleted = questProgress?.completed || false;
            const progressPercentage = (currentCount / quest.target_count) * 100;

            return (
              <Card
                key={quest.id}
                className={`${
                  isCompleted
                    ? "border-primary bg-primary/5"
                    : "border-border"
                } transition-all duration-300`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{quest.icon}</span>
                      <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          {quest.title}
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {quest.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                      <Coins className="w-3 h-3" />
                      {quest.reward_coins}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {currentCount}/{quest.target_count}
                      {isCompleted && " - Completed! ✓"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
    </>
  );
};
