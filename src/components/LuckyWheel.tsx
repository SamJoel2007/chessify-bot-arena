import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { updateQuestProgress } from "@/lib/questUtils";

interface Prize {
  id: string;
  name: string;
  icon: string;
  type: "bot" | "avatar" | "theme";
  color?: string;
  rarity?: string;
}

interface LuckyWheelProps {
  onPrizeWon: () => void;
}

const prizes: Prize[] = [
  { id: "bot-1", name: "Dragon Knight", icon: "🐉", type: "bot" },
  { id: "4", name: "Cool King", icon: "👑", type: "avatar", rarity: "uncommon" },
  { id: "theme-1", name: "Wood Classic", icon: "🎨", type: "theme", color: "from-amber-800 to-amber-600" },
  { id: "7", name: "Fire Phoenix", icon: "🔥", type: "avatar", rarity: "rare" },
  { id: "bot-2", name: "Cyber Warrior", icon: "🤖", type: "bot" },
  { id: "10", name: "Dragon Soul", icon: "🐲", type: "avatar", rarity: "epic" },
  { id: "theme-2", name: "Crystal Ice", icon: "❄️", type: "theme", color: "from-cyan-200 to-blue-300" },
  { id: "22", name: "Galaxy Crown", icon: "🌌", type: "avatar", rarity: "legendary" },
];

export const LuckyWheel = ({ onPrizeWon }: LuckyWheelProps) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState("");
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [availablePrizes, setAvailablePrizes] = useState<Prize[]>(prizes);

  useEffect(() => {
    checkSpinAvailability();
    const interval = setInterval(checkSpinAvailability, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filterAvailablePrizes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: purchases } = await supabase
        .from("user_purchases")
        .select("item_id, item_type")
        .eq("user_id", user.id);

      if (purchases && purchases.length > 0) {
        const ownedItems = new Set(
          purchases.map(p => `${p.item_type}-${p.item_id}`)
        );
        
        const available = prizes.filter(
          prize => !ownedItems.has(`${prize.type}-${prize.id}`)
        );
        
        setAvailablePrizes(available.length > 0 ? available : prizes);
      }
    };

    filterAvailablePrizes();
  }, []);

  const checkSpinAvailability = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_spins")
      .select("last_spin_at")
      .eq("user_id", user.id)
      .order("last_spin_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      setCanSpin(true);
      setTimeUntilNextSpin("");
      return;
    }

    const lastSpin = new Date(data.last_spin_at);
    const nextSpin = new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now >= nextSpin) {
      setCanSpin(true);
      setTimeUntilNextSpin("");
    } else {
      setCanSpin(false);
      const diff = nextSpin.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilNextSpin(`${hours}h ${minutes}m ${seconds}s`);
    }
  };

  const handleSpin = async () => {
    if (!canSpin || spinning) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to spin the wheel");
      return;
    }

    if (availablePrizes.length === 0) {
      toast.info("You already own all lucky draw prizes! 🎉");
      return;
    }

    setSpinning(true);
    setSelectedPrize(null);

    // Random prize selection from available prizes
    const prizeIndex = Math.floor(Math.random() * availablePrizes.length);
    const prize = availablePrizes[prizeIndex];
    
    // Calculate rotation (multiple full spins + final position)
    const wheelIndex = prizes.findIndex(p => p.id === prize.id);
    const segmentAngle = 360 / prizes.length;
    const finalRotation = 360 * 5 + (360 - (wheelIndex * segmentAngle + segmentAngle / 2));
    
    setRotation(finalRotation);

    // Wait for animation to complete (10 seconds)
    setTimeout(async () => {
      setSpinning(false);
      setSelectedPrize(prize);

      // Check if already owned
      const { data: existingPurchase } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", prize.type)
        .eq("item_id", prize.id)
        .single();

      if (existingPurchase) {
        toast.info(`You already own ${prize.name}! Better luck next time.`);
      } else {
        // Award the prize
        const { error: purchaseError } = await supabase.rpc("handle_purchase", {
          p_item_type: prize.type,
          p_item_id: prize.id,
          p_item_name: prize.name,
          p_item_data: { icon: prize.icon, color: prize.color },
          p_price: 0,
        });

        if (purchaseError) {
          toast.error(`Failed to award prize: ${purchaseError.message}`);
          return;
        }

        toast.success(`🎉 You won ${prize.name}!`);
        onPrizeWon();
      }

      // Update spin record
      const { data: existingSpin } = await supabase
        .from("user_spins")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingSpin) {
        await supabase
          .from("user_spins")
          .update({ last_spin_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_spins")
          .insert({ user_id: user.id, last_spin_at: new Date().toISOString() });
      }

      // Track quest progress for spinning the wheel
      await updateQuestProgress(user.id, 'spin_wheel');

      setCanSpin(false);
    }, 10000);
  };

  const segmentAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Card className="p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2 border-primary/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-gold" />
            Lucky Wheel
            <Sparkles className="w-8 h-8 text-gold" />
          </h2>
          <p className="text-muted-foreground">Spin the wheel for a chance to win prizes!</p>
          <p className="text-sm text-primary mt-2">Free spin every 24 hours</p>
        </div>

        <div className="relative flex items-center justify-center mb-8">
          {/* Pointer Arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-primary drop-shadow-lg" />
          </div>

          {/* Wheel Container */}
          <div className="relative w-[400px] h-[400px]">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/50 to-amber-700/50 p-4 shadow-2xl">
              {/* Wheel */}
              <div
                className={cn(
                  "relative w-full h-full rounded-full overflow-hidden shadow-inner transition-transform",
                  spinning ? "duration-[10000ms] ease-in-out" : "duration-300"
                )}
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {prizes.map((prize, index) => {
                  const angle = index * segmentAngle;
                  const isEven = index % 2 === 0;
                  
                  return (
                    <div
                      key={prize.id}
                      className="absolute w-full h-full"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      <div
                        className={cn(
                          "absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0",
                          "border-l-[200px] border-l-transparent",
                          "border-r-[200px] border-r-transparent",
                          "border-b-[200px]",
                          isEven ? "border-b-card/90" : "border-b-card/70"
                        )}
                        style={{
                          clipPath: `polygon(50% 100%, ${50 - Math.tan((segmentAngle / 2) * Math.PI / 180) * 100}% 0%, ${50 + Math.tan((segmentAngle / 2) * Math.PI / 180) * 100}% 0%)`,
                        }}
                      />
                      <div
                        className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                        style={{
                          transform: `translateX(-50%) rotate(${segmentAngle / 2}deg)`,
                        }}
                      >
                        <span className="text-4xl">{prize.icon}</span>
                        <span className="text-xs font-bold text-center whitespace-nowrap">{prize.name}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-600 shadow-lg flex items-center justify-center border-4 border-white">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedPrize && (
          <div className="text-center mb-4 animate-fade-in">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-gold/20 to-amber-600/20 rounded-lg border-2 border-gold">
              <p className="text-lg font-bold">You won: {selectedPrize.icon} {selectedPrize.name}!</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          {canSpin ? (
            <Button
              onClick={handleSpin}
              disabled={spinning}
              size="lg"
              className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              {spinning ? (
                <>
                  <div className="animate-spin mr-2">⚡</div>
                  Spinning...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" />
                  Spin Now!
                </>
              )}
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Button
                disabled
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-bold"
              >
                <Clock className="mr-2" />
                Next Spin Available
              </Button>
              <p className="text-sm text-muted-foreground">
                Time remaining: <span className="font-bold text-primary">{timeUntilNextSpin}</span>
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};