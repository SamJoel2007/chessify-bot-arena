import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Lock, Zap, Ghost, Sparkles, Swords } from "lucide-react";
import { toast } from "sonner";

interface BotSelectionProps {
  coins: number;
  setCoins: (coins: number) => void;
}

const bots = [
  {
    id: 1,
    name: "Chess Novice",
    category: "Beginner",
    rating: 800,
    icon: Bot,
    color: "text-green-400",
    owned: true,
    price: 0,
  },
  {
    id: 2,
    name: "Strategic Mind",
    category: "Intermediate",
    rating: 1400,
    icon: Zap,
    color: "text-blue-400",
    owned: true,
    price: 0,
  },
  {
    id: 3,
    name: "Grand Master AI",
    category: "Advanced",
    rating: 2200,
    icon: Sparkles,
    color: "text-purple-400",
    owned: false,
    price: 500,
  },
  {
    id: 4,
    name: "Spooky Knight",
    category: "Halloween",
    rating: 1600,
    icon: Ghost,
    color: "text-orange-400",
    owned: false,
    price: 300,
  },
  {
    id: 5,
    name: "Samurai Master",
    category: "Anime",
    rating: 1800,
    icon: Swords,
    color: "text-red-400",
    owned: false,
    price: 400,
  },
];

export const BotSelection = ({ coins, setCoins }: BotSelectionProps) => {
  const handlePurchase = (bot: typeof bots[0]) => {
    if (coins >= bot.price) {
      setCoins(coins - bot.price);
      toast.success(`Purchased ${bot.name}!`);
    } else {
      toast.error("Not enough coins!");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Chess Bots</h2>
        <p className="text-muted-foreground">Choose your opponent and test your skills</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot) => {
          const Icon = bot.icon;
          return (
            <Card
              key={bot.id}
              className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-muted/30 ${bot.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <Badge variant="outline">{bot.category}</Badge>
              </div>

              <h3 className="text-xl font-bold mb-2">{bot.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rating: <span className="font-bold text-foreground">{bot.rating}</span>
              </p>

              {bot.owned ? (
                <Button className="w-full">Play Now</Button>
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
