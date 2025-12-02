import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import beginnerCenterControl from "@/assets/bots/beginner-09-center-control.jpg";
import intermediateStrategicSam from "@/assets/bots/intermediate-02-strategic-sam.jpg";
import intermediateGambitGary from "@/assets/bots/intermediate-07-gambit-gary.jpg";

interface BotSelectionProps {
  coins: number;
  onCoinsUpdate: () => void;
}

const bots = [
  {
    id: 1,
    name: "Ava",
    category: "Beginner",
    rating: 800,
    image: beginnerCenterControl,
    owned: true,
    price: 0,
  },
  {
    id: 2,
    name: "Samuel",
    category: "Intermediate",
    rating: 1100,
    image: intermediateStrategicSam,
    owned: true,
    price: 0,
  },
  {
    id: 3,
    name: "Gary",
    category: "Intermediate",
    rating: 1500,
    image: intermediateGambitGary,
    owned: true,
    price: 0,
  },
];

export const BotSelection = ({ coins, onCoinsUpdate }: BotSelectionProps) => {
  const navigate = useNavigate();
  const [allBots, setAllBots] = useState(bots);
  
  useEffect(() => {
    fetchPurchasedBots();
  }, []);

  const fetchPurchasedBots = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAllBots(bots);
      return;
    }

    const { data: purchasedBots } = await supabase
      .from("user_purchases")
      .select("item_id, item_name, item_data")
      .eq("user_id", user.id)
      .eq("item_type", "bot");

    if (purchasedBots && purchasedBots.length > 0) {
      const newBots = purchasedBots.map((pb, index) => {
        const botData = pb.item_data as any;
        return {
          id: 100 + index,
          name: pb.item_name,
          category: (botData.category || "Intermediate").charAt(0).toUpperCase() + (botData.category || "intermediate").slice(1),
          rating: botData.rating || 1000,
          image: undefined,
          owned: true,
          price: 0,
        };
      });
      
      setAllBots([...bots, ...newBots]);
    }
  };
  
  const handlePurchase = (bot: typeof bots[0]) => {
    if (coins >= bot.price) {
      onCoinsUpdate();
      toast.success(`Purchased ${bot.name}!`);
    } else {
      toast.error("Not enough coins!");
    }
  };

  const handlePlayNow = (bot: typeof bots[0]) => {
    navigate('/game', { state: { selectedBot: bot } });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Chess Bots</h2>
        <p className="text-muted-foreground">Choose your opponent and test your skills</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allBots.map((bot) => {
          return (
            <Card
              key={bot.id}
              className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4 group">
                {bot.image ? (
                  <img 
                    src={bot.image} 
                    alt={bot.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-card border-2 border-primary/30 flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    ♟️
                  </div>
                )}
                <Badge variant="outline">{bot.category}</Badge>
              </div>

              <h3 className="text-xl font-bold mb-2">{bot.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rating: <span className="font-bold text-foreground">{bot.rating}</span>
              </p>

              {bot.owned ? (
                <Button className="w-full" onClick={() => handlePlayNow(bot)}>
                  Play Now
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => handlePurchase(bot)}
                >
                  <Lock className="w-4 h-4" />
                  Buy for {bot.price} coins
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
