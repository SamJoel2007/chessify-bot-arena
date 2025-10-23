import { useState } from "react";
import { Crown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameBoard } from "@/components/GameBoard";
import { BotSelection } from "@/components/BotSelection";
import { CommunityChat } from "@/components/CommunityChat";
import { ShopModal } from "@/components/ShopModal";

const Index = () => {
  const [activeView, setActiveView] = useState<"play" | "bots" | "chat">("play");
  const [coins, setCoins] = useState(1000);
  const [isShopOpen, setIsShopOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Chessify
            </h1>
          </div>
          
          <nav className="flex gap-2">
            <Button
              variant={activeView === "play" ? "default" : "ghost"}
              onClick={() => setActiveView("play")}
            >
              Play
            </Button>
            <Button
              variant={activeView === "bots" ? "default" : "ghost"}
              onClick={() => setActiveView("bots")}
            >
              Bots
            </Button>
            <Button
              variant={activeView === "chat" ? "default" : "ghost"}
              onClick={() => setActiveView("chat")}
            >
              Community
            </Button>
          </nav>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsShopOpen(true)}
            >
              <Coins className="w-5 h-5 text-gold" />
              <span className="font-bold text-gold">{coins}</span>
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-primary" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeView === "play" && <GameBoard />}
        {activeView === "bots" && <BotSelection coins={coins} setCoins={setCoins} />}
        {activeView === "chat" && <CommunityChat />}
      </main>

      <ShopModal 
        isOpen={isShopOpen} 
        onClose={() => setIsShopOpen(false)}
        coins={coins}
        setCoins={setCoins}
      />
    </div>
  );
};

export default Index;
