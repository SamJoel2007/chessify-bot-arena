import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Coins, Trophy, Users, Zap, Shield, Megaphone, Puzzle, Store, Menu } from "lucide-react";
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
import { HoverSidebar } from "@/components/HoverSidebar";
import { FindPeople } from "@/components/FindPeople";
import winterArcImage from "@/assets/winter-arc-hero.jpg";
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    // Load ad script
    const script = document.createElement("script");
    script.src = "//pl27964518.effectivegatecpm.com/6b73e2d7b6ada28eb7fcb5b7a7102a06/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    document.body.appendChild(script);

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        // Automatically sign in as guest if no session exists
        const { data, error } = await supabase.auth.signInAnonymously();
        if (data?.user && !error) {
          setUser(data.user);
          // Ensure profile exists for anonymous user
          await ensureProfileExists(data.user.id);
        }
      }
    };

    const ensureProfileExists = async (userId: string) => {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
      
      if (!existing) {
        await supabase.from("profiles").insert({
          id: userId,
          username: "Player",
          points: 0
        });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user && !session.user.is_anonymous) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      // Cleanup ad script
      const scripts = document.querySelectorAll('script[src*="effectivegatecpm.com"]');
      scripts.forEach(script => script.remove());
    };
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

  useEffect(() => {
    // Fetch event data
    const fetchEventData = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("name", "Winter ARC Chess")
        .single();

      setEventData(data);
    };

    fetchEventData();

    // Subscribe to event updates
    const channel = supabase
      .channel('event-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, fetchEventData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePlayAyanokoji = () => {
    const ayanokojiBot = {
      id: "special-ayanokoji",
      name: "Ayanokoji",
      rating: 2500,
      description: "A chess prodigy with unmatched strategic thinking",
      difficulty: "Elite",
      image: null,
      isSpecialEvent: true
    };

    navigate('/game', { state: { selectedBot: ayanokojiBot } });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hover Sidebar */}
      <HoverSidebar 
        user={user} 
        currentAvatar={currentAvatar}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/90 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-2 md:px-4 py-3 md:py-4 flex items-center justify-between max-w-full">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="mr-1 md:mr-2 w-8 h-8 md:w-10 md:h-10"
                >
                  <Menu className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              )}
              <Crown className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent hidden sm:block">
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
                onClick={() => document.getElementById('tournament')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Events
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('puzzles')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Puzzles
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/community')}
              >
                Community
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/feed')}
              >
                Feed
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              className="gap-1 md:gap-2 px-2 md:px-4"
              size="sm"
              onClick={() => setShowShop(true)}
            >
              <Store className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span className="hidden md:inline">Shop</span>
            </Button>
            <Button
              variant="outline"
              className="gap-1 md:gap-2 px-2 md:px-4"
              size="sm"
              onClick={() => navigate('/purchase-coins')}
            >
              <Coins className="w-4 h-4 md:w-5 md:h-5 text-gold" />
              <span className="font-bold text-gold text-xs md:text-sm">{coins}</span>
            </Button>
            {user?.is_anonymous ? (
              <Button variant="default" onClick={() => navigate("/auth")} size="sm" className="px-2 md:px-4 text-xs md:text-sm">
                Sign Up
              </Button>
            ) : (
              <Button variant="outline" onClick={handleSignOut} size="sm" className="px-2 md:px-4 text-xs md:text-sm hidden sm:flex">
                Sign Out
              </Button>
            )}
            <Avatar 
              className="cursor-pointer hover:ring-2 hover:ring-primary transition-all w-8 h-8 md:w-10 md:h-10" 
              onClick={() => setShowAvatarSelector(true)}
            >
              <AvatarFallback className="bg-gradient-primary text-2xl md:text-3xl">
                {getAvatarIcon(currentAvatar)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border/60 bg-gradient-card py-20 shadow-glow-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Master Your Chess Game
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Play against friends, challenge AI bots, and join a thriving community of chess enthusiasts
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Card className="p-6 bg-card/60 border-primary/30 flex items-center gap-3 hover:border-primary/50 hover:shadow-glow transition-all">
              <Trophy className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="text-2xl font-bold">10K+</p>
                <p className="text-sm text-muted-foreground">Active Players</p>
              </div>
            </Card>
            <Card className="p-6 bg-card/60 border-secondary/30 flex items-center gap-3 hover:border-secondary/50 hover:shadow-glow-secondary transition-all">
              <Zap className="w-8 h-8 text-secondary" />
              <div className="text-left">
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-muted-foreground">Chess Bots</p>
              </div>
            </Card>
            <Card className="p-6 bg-card/60 border-accent/30 flex items-center gap-3 hover:border-accent/50 hover:shadow-glow transition-all">
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

        {/* Winter ARC Chess Event Section */}
        <section id="tournament" className="mb-16">
          <Card className="overflow-hidden bg-gradient-card border-primary/30 shadow-glow hover:border-primary/50 transition-all">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-8 h-8 text-gold" />
                  <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Winter ARC Chess
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg mb-6">
                  Face the ultimate challenge against Ayanokoji, a legendary chess prodigy with a 2500 ELO rating. 
                  Defeat this formidable opponent to earn an exclusive Winter ARC Chess certificate and 1000 bonus coins. 
                  Only the most skilled players will prevail in this elite battle of wits and strategy!
                </p>
                <div className="flex gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">2500</p>
                    <p className="text-sm text-muted-foreground">ELO Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gold">1000</p>
                    <p className="text-sm text-muted-foreground">Coin Reward</p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="gap-2 shadow-glow hover:shadow-glow-secondary transition-all w-full"
                  onClick={handlePlayAyanokoji}
                >
                  <Zap className="w-5 h-5" />
                  Play Now
                </Button>
              </div>
              <div className="h-full min-h-[400px]">
                <img 
                  src={winterArcImage} 
                  alt="Winter ARC Chess Challenge" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </Card>
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
            <Card className="overflow-hidden bg-card/60 border-primary/20 hover:border-primary/60 transition-all hover:shadow-glow hover:scale-105 duration-300">
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

            <Card className="overflow-hidden bg-card/60 border-primary/20 hover:border-primary/60 transition-all hover:shadow-glow hover:scale-105 duration-300">
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
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/puzzle-game', { 
                    state: { 
                      puzzle: {
                        id: "p2",
                        name: "Mate in 2",
                        description: "Calculate the winning sequence in this tactical puzzle",
                        rating: 1400,
                        difficulty: "intermediate",
                        fen: "r2qkb1r/pp2nppp/3p4/2pNN1B1/2BnP3/3P4/PPP2PPP/R2bK2R w KQkq - 0 1",
                        solution: ["Nf6+", "gxf6", "Bxf7#"],
                      }
                    }
                  })}
                >
                  Play Now
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden bg-card/60 border-primary/20 hover:border-primary/60 transition-all hover:shadow-glow hover:scale-105 duration-300">
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
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/puzzle-game', { 
                    state: { 
                      puzzle: {
                        id: "p3",
                        name: "Mate in 3",
                        description: "Master this complex combination to achieve checkmate",
                        rating: 2000,
                        difficulty: "advanced",
                        fen: "r1b1kb1r/pppp1ppp/5q2/4n3/3KP3/2N5/PPP2PPP/R1BQ1BNR w kq - 0 1",
                        solution: ["Qd5", "Qf4", "Qxe5+", "Qxe5", "Nxe5"],
                      }
                    }
                  })}
                >
                  Play Now
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden bg-card/60 border-primary/20 hover:border-primary/60 transition-all hover:shadow-glow hover:scale-105 duration-300">
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

        {/* AI Coach Section */}
        <section id="coach" className="mb-16">
          <Card className="overflow-hidden bg-gradient-card border-primary/30 shadow-glow hover:border-primary/50 transition-all">
            <div className="p-8 md:p-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl">🎓</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
                Meet Your AI Chess Coach
              </h2>
              <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
                Get personalized chess lessons from ChessMentor, your AI-powered coach. 
                Learn openings, tactics, strategy, and improve your game with interactive conversations.
              </p>
              <div className="flex gap-4 justify-center mb-6 flex-wrap">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">∞</p>
                  <p className="text-sm text-muted-foreground">Patience</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">Expert</p>
                  <p className="text-sm text-muted-foreground">Knowledge</p>
                </div>
              </div>
              <Button 
                size="lg" 
                className="gap-2 shadow-glow hover:shadow-glow-secondary transition-all"
                onClick={() => user ? navigate('/coach') : navigate('/auth')}
              >
                <span className="text-xl">♟️</span>
                Start Learning
              </Button>
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
          <FindPeople userId={user?.id || null} />
          
          {/* Native Banner Ad */}
          <div className="mt-8 flex justify-center">
            <div id="container-6b73e2d7b6ada28eb7fcb5b7a7102a06"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-gradient-card/50 py-12">
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
