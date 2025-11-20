import { useEffect, useState } from "react";
import { Coins } from "lucide-react";

interface QuestCoinRewardProps {
  amount: number;
  onComplete: () => void;
}

export const QuestCoinReward = ({ amount, onComplete }: QuestCoinRewardProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-[bounce_0.6s_ease-in-out_3] opacity-0 animate-fade-in">
        <div className="bg-primary/95 backdrop-blur-sm text-primary-foreground rounded-2xl px-8 py-6 shadow-2xl border-4 border-primary-foreground/20 flex items-center gap-4 scale-110">
          <div className="relative">
            <Coins className="w-12 h-12 animate-spin" style={{ animationDuration: '1s' }} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">+{amount}</div>
            <div className="text-sm opacity-90">Coins Earned!</div>
          </div>
        </div>
      </div>
    </div>
  );
};
