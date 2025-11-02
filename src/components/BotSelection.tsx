import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import beginnerCenterControl from "@/assets/bots/beginner-09-center-control.jpg";
import intermediateStrategicSam from "@/assets/bots/intermediate-02-strategic-sam.jpg";
import intermediateGambitGary from "@/assets/bots/intermediate-07-gambit-gary.jpg";
import animeLight from "@/assets/bots/anime-03-light-yagami.jpg";
import animeLelouch from "@/assets/bots/anime-06-lelouch.jpg";

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
    owned: false,
    price: 300,
  },
  {
    id: 4,
    name: "Light",
    category: "Anime",
    rating: 2200,
    image: animeLight,
    owned: false,
    price: 500,
  },
  {
    id: 5,
    name: "Suzaku",
    category: "Anime",
    rating: 2500,
    image: animeLelouch,
    owned: false,
    price: 700,
  },
];

export const BotSelection = ({ coins, onCoinsUpdate }: BotSelectionProps) => {
  const navigate = useNavigate();
  
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
        {bots.map((bot) => {
          return (
            <Card
              key={bot.id}
              className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4">
                <img 
                  src={bot.image} 
                  alt={bot.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                />
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
