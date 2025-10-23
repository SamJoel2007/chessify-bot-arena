import { useState } from "react";
import { Crown, Coins, Trophy, Users, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameBoard } from "@/components/GameBoard";
import { BotSelection } from "@/components/BotSelection";
import { CommunityChat } from "@/components/CommunityChat";
import { ShopModal } from "@/components/ShopModal";
import tournamentImage from "@/assets/tournament-hero.jpg";

const Index = () => {
  const [coins, setCoins] = useState(1000);
  const [isShopOpen, setIsShopOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Crown className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Chessify
              </h1>
            </div>
            
            <nav className="hidden md:flex gap-2">
              <Button
                variant="ghost"
                onClick={() => document.getElementById('play')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Play
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('bots')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Bots
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('tournament')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Tournament
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsShopOpen(true)}
              >
                Shop
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Community
              </Button>
            </nav>
          </div>

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

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-card py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Master Your Chess Game
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Play against friends, challenge AI bots, and join a thriving community of chess enthusiasts
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Card className="p-6 bg-card/50 border-border/50 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="text-2xl font-bold">10K+</p>
                <p className="text-sm text-muted-foreground">Active Players</p>
              </div>
            </Card>
            <Card className="p-6 bg-card/50 border-border/50 flex items-center gap-3">
              <Zap className="w-8 h-8 text-secondary" />
              <div className="text-left">
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-muted-foreground">Chess Bots</p>
              </div>
            </Card>
            <Card className="p-6 bg-card/50 border-border/50 flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" />
              <div className="text-left">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-muted-foreground">Community</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Game Board Section */}
        <section id="play" className="mb-16">
          <GameBoard />
        </section>

        {/* Bots Section */}
        <section id="bots" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
              Challenge Our Bots
            </h2>
            <p className="text-muted-foreground text-lg">
              Test your skills against AI opponents of varying difficulty levels
            </p>
          </div>
          <BotSelection coins={coins} setCoins={setCoins} />
        </section>

        {/* Tournament Section */}
        <section id="tournament" className="mb-16">
          <Card className="overflow-hidden bg-gradient-card border-border/50">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-8 h-8 text-gold" />
                  <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Tournaments
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg mb-6">
                  Compete in exciting chess tournaments and climb the leaderboard! Join weekly competitions, 
                  win exclusive prizes, and prove your skills against the best players from around the world. 
                  Whether you're a beginner or a grandmaster, there's a tournament for everyone.
                </p>
                <div className="flex gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">250+</p>
                    <p className="text-sm text-muted-foreground">Active Tournaments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gold">$10K</p>
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                  </div>
                </div>
                <Button size="lg" className="gap-2 shadow-glow">
                  <Trophy className="w-5 h-5" />
                  Register Now
                </Button>
              </div>
              <div className="h-full min-h-[400px]">
                <img 
                  src={tournamentImage} 
                  alt="Chess Tournament" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Community Section */}
        <section id="community" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
              Join Our Community
            </h2>
            <p className="text-muted-foreground text-lg">
              Connect with players worldwide and share your chess journey
            </p>
          </div>
          <CommunityChat />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Chessify
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your ultimate online chess platform for players of all levels
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-3">Play</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#play" className="hover:text-primary transition-colors">Quick Match</a></li>
                <li><a href="#bots" className="hover:text-primary transition-colors">Play vs Bot</a></li>
                <li><a href="#play" className="hover:text-primary transition-colors">Play vs Friend</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#community" className="hover:text-primary transition-colors">Chat Room</a></li>
                <li><a href="#community" className="hover:text-primary transition-colors">Forums</a></li>
                <li><a href="#community" className="hover:text-primary transition-colors">Tournaments</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Learn Chess</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Strategy Guide</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 Chessify. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
