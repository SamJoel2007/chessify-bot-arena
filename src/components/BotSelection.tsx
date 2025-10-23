import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import botBeginner from "@/assets/bot-beginner.jpg";
import botIntermediate from "@/assets/bot-intermediate.jpg";
import botAdvanced from "@/assets/bot-advanced.jpg";
import botGrandmaster from "@/assets/bot-grandmaster.jpg";
import botHalloween from "@/assets/bot-halloween.jpg";
import botAnime from "@/assets/bot-anime.jpg";

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
    image: botBeginner,
    owned: true,
    price: 0,
  },
  {
    id: 2,
    name: "Strategic Mind",
    category: "Intermediate",
    rating: 1400,
    image: botIntermediate,
    owned: true,
    price: 0,
  },
  {
    id: 3,
    name: "Grand Master AI",
    category: "Advanced",
    rating: 2200,
    image: botGrandmaster,
    owned: false,
    price: 500,
  },
  {
    id: 4,
    name: "Spooky Knight",
    category: "Halloween",
    rating: 1600,
    image: botHalloween,
    owned: false,
    price: 300,
  },
  {
    id: 5,
    name: "Samurai Master",
    category: "Anime",
    rating: 1800,
    image: botAnime,
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
