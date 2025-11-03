import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Coins, Trophy, Users, Zap, Shield, Megaphone, Puzzle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GameBoard } from "@/components/GameBoard";
import { BotSelection } from "@/components/BotSelection";
import { CommunityChat } from "@/components/CommunityChat";
import { AvatarSelector } from "@/components/AvatarSelector";
import { ShopModal } from "@/components/ShopModal";
import { RecentPosts } from "@/components/RecentPosts";
import { AdminPostCreator } from "@/components/AdminPostCreator";
import { OnlineMatchmaking } from "@/components/OnlineMatchmaking";
import tournamentImage from "@/assets/tournament-hero.jpg";
import puzzleBeginner from "@/assets/puzzles/puzzle-beginner.jpg";
import puzzleIntermediate from "@/assets/puzzles/puzzle-intermediate.jpg";
import puzzleAdvanced from "@/assets/puzzles/puzzle-advanced.jpg";
import puzzleExpert from "@/assets/puzzles/puzzle-expert.jpg";
import { toast } from "sonner";
import { getAvatarIcon } from "@/lib/avatarUtils";

const Index = () => {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(1000);
  const [user, setUser] = useState<any>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showShop, setShowShop] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("coins, current_avatar")
      .eq("id", userId)
      .single();

    if (data) {
      setCoins(data.coins || 1000);
      setCurrentAvatar(data.current_avatar);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

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
                onClick={() => navigate('/bots')}
              >
                Bots
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('online')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Online
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('tournament')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Tournament
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('puzzles')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Puzzles
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Posts
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
              onClick={() => user ? setShowShop(true) : navigate('/auth')}
            >
              <Store className="w-5 h-5 text-primary" />
              Shop
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/purchase-coins')}
            >
              <Coins className="w-5 h-5 text-gold" />
              <span className="font-bold text-gold">{coins}</span>
            </Button>
            {user ? (
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button variant="default" onClick={() => navigate("/auth")}>
                  Sign Up
                </Button>
              </>
            )}
            <Avatar 
              className="cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
              onClick={() => user && setShowAvatarSelector(true)}
            >
              <AvatarFallback className="bg-gradient-primary text-3xl">
                {getAvatarIcon(currentAvatar)}
              </AvatarFallback>
            </Avatar>
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

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        currentAvatar={currentAvatar}
        onAvatarChange={(avatarId) => setCurrentAvatar(avatarId)}
      />

      {/* Shop Modal */}
      <ShopModal
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        coins={coins}
        onCoinsUpdate={() => user && fetchUserProfile(user.id)}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Game Board Section */}
        <section id="play" className="mb-16">
          <GameBoard 
            userId={user?.id}
            username={user?.email?.split('@')[0]}
            currentAvatar={currentAvatar || undefined}
          />
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
          <BotSelection coins={coins} onCoinsUpdate={() => user && fetchUserProfile(user.id)} />
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

        {/* Recent Posts Section */}
        <section id="posts" className="mb-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Megaphone className="w-8 h-8 text-primary" />
              <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Recent Posts
              </h2>
            </div>
            <p className="text-muted-foreground text-lg mb-6">
              Stay updated with the latest events, tournaments, and community highlights
            </p>
          </div>
          <AdminPostCreator />
          <RecentPosts />
        </section>

        {/* Puzzles Section */}
        <section id="puzzles" className="mb-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Puzzle className="w-8 h-8 text-primary" />
              <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Puzzles
              </h2>
            </div>
            <p className="text-muted-foreground text-lg">
              Sharpen your tactical skills with chess puzzles from beginner to expert level
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-glow">
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={puzzleBeginner}
                  alt="Beginner Puzzle"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Mate in 1</h3>
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Find the winning move in this beginner puzzle
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-500">
                    Beginner
                  </span>
                  <span className="text-xs text-muted-foreground">Rating: 800</span>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/puzzle-game', { 
                    state: { 
                      puzzle: {
                        id: "p1",
                        name: "Mate in 1",
                        description: "Find the winning move in this beginner puzzle",
                        rating: 800,
                        difficulty: "beginner",
                        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
                        solution: ["Qxf7#"],
                      }
                    }
                  })}
                >
                  Play Now
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-glow">
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={puzzleIntermediate}
                  alt="Intermediate Puzzle"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Mate in 2</h3>
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Calculate the winning sequence in this tactical puzzle
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-500">
                    Intermediate
                  </span>
                  <span className="text-xs text-muted-foreground">Rating: 1400</span>
                </div>
                <Button className="w-full" onClick={() => navigate('/puzzles')}>
                  Play Now
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-glow">
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={puzzleAdvanced}
                  alt="Advanced Puzzle"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Mate in 3</h3>
                  <Shield className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Master this complex combination to achieve checkmate
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-500">
                    Advanced
                  </span>
                  <span className="text-xs text-muted-foreground">Rating: 2000</span>
                </div>
                <Button className="w-full" onClick={() => navigate('/puzzles')}>
                  Play Now
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-glow">
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={puzzleExpert}
                  alt="Expert Puzzle"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Brilliant Sacrifice</h3>
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Only the best can spot this brilliant winning move
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gold/20 text-gold">
                    Expert
                  </span>
                  <span className="text-xs text-muted-foreground">Rating: 2500</span>
                </div>
                <Button className="w-full" onClick={() => navigate('/puzzles')}>
                  Play Now
                </Button>
              </div>
            </Card>
          </div>
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

    </div>
  );
};

export default Index;
