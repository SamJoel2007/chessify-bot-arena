import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameBoard } from "@/components/GameBoard";
import { useEffect, useState } from "react";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedBot, setSelectedBot] = useState<any>(null);

  useEffect(() => {
    if (location.state?.selectedBot) {
      setSelectedBot(location.state.selectedBot);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Chessify
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Game Section */}
      <main className="container mx-auto px-4 py-12">
        <GameBoard selectedBot={selectedBot} onBotChange={setSelectedBot} />
      </main>
    </div>
  );
};

export default Game;
