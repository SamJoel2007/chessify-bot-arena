import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowLeft, Zap, Trophy, Star, Sparkles, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import botBeginner from "@/assets/bot-beginner.jpg";
import botIntermediate from "@/assets/bot-intermediate.jpg";
import botAdvanced from "@/assets/bot-advanced.jpg";
import botGrandmaster from "@/assets/bot-grandmaster.jpg";
import botAnime from "@/assets/bot-anime.jpg";
import beginnerPawnPusher from "@/assets/bots/beginner-01-pawn-pusher.jpg";
import beginnerCastleKeeper from "@/assets/bots/beginner-02-castle-keeper.jpg";
import beginnerKnightNovice from "@/assets/bots/beginner-03-knight-novice.jpg";
import beginnerBishopBuddy from "@/assets/bots/beginner-04-bishop-buddy.jpg";
import beginnerRookRookie from "@/assets/bots/beginner-05-rook-rookie.jpg";
import beginnerQueensGuard from "@/assets/bots/beginner-06-queens-guard.jpg";
import beginnerKingsShadow from "@/assets/bots/beginner-07-kings-shadow.jpg";
import beginnerCheckChaser from "@/assets/bots/beginner-08-check-chaser.jpg";
import beginnerCenterControl from "@/assets/bots/beginner-09-center-control.jpg";
import beginnerOpeningExplorer from "@/assets/bots/beginner-10-opening-explorer.jpg";

interface Bot {
  id: string;
  name: string;
  rating: number;
  description: string;
  difficulty: string;
  image?: string;
}

const botCategories = {
  beginner: {
    icon: Star,
    color: "text-green-500",
    image: botBeginner,
    bots: [
      { id: "b1", name: "Pawn Pusher", rating: 400, description: "Just learning the basics", difficulty: "Beginner", image: beginnerPawnPusher },
      { id: "b2", name: "Castle Keeper", rating: 450, description: "Loves castling early", difficulty: "Beginner", image: beginnerCastleKeeper },
      { id: "b3", name: "Knight Novice", rating: 500, description: "Enjoys knight moves", difficulty: "Beginner", image: beginnerKnightNovice },
      { id: "b4", name: "Bishop Buddy", rating: 550, description: "Diagonal specialist", difficulty: "Beginner", image: beginnerBishopBuddy },
      { id: "b5", name: "Rook Rookie", rating: 600, description: "Learning rook endgames", difficulty: "Beginner", image: beginnerRookRookie },
      { id: "b6", name: "Queen's Guard", rating: 650, description: "Protective player", difficulty: "Beginner", image: beginnerQueensGuard },
      { id: "b7", name: "King's Shadow", rating: 700, description: "Defensive minded", difficulty: "Beginner", image: beginnerKingsShadow },
      { id: "b8", name: "Check Chaser", rating: 750, description: "Loves giving checks", difficulty: "Beginner", image: beginnerCheckChaser },
      { id: "b9", name: "Center Control", rating: 800, description: "Controls the center", difficulty: "Beginner", image: beginnerCenterControl },
      { id: "b10", name: "Opening Explorer", rating: 850, description: "Learning openings", difficulty: "Beginner", image: beginnerOpeningExplorer },
    ],
  },
  intermediate: {
    icon: Zap,
    color: "text-blue-500",
    image: botIntermediate,
    bots: [
      { id: "i1", name: "Tactical Tim", rating: 1000, description: "Spots basic tactics", difficulty: "Intermediate" },
      { id: "i2", name: "Strategic Sam", rating: 1100, description: "Plans ahead", difficulty: "Intermediate" },
      { id: "i3", name: "Endgame Eddie", rating: 1200, description: "Strong finisher", difficulty: "Intermediate" },
      { id: "i4", name: "Positional Pete", rating: 1300, description: "Loves good positions", difficulty: "Intermediate" },
      { id: "i5", name: "Attack Andy", rating: 1400, description: "Aggressive player", difficulty: "Intermediate" },
      { id: "i6", name: "Defense Dan", rating: 1450, description: "Solid defender", difficulty: "Intermediate" },
      { id: "i7", name: "Gambit Gary", rating: 1500, description: "Loves gambits", difficulty: "Intermediate" },
      { id: "i8", name: "Counter Carl", rating: 1550, description: "Counter-attack expert", difficulty: "Intermediate" },
      { id: "i9", name: "Pattern Paul", rating: 1600, description: "Recognizes patterns", difficulty: "Intermediate" },
      { id: "i10", name: "Tempo Terry", rating: 1650, description: "Never wastes time", difficulty: "Intermediate" },
    ],
  },
  advanced: {
    icon: Trophy,
    color: "text-purple-500",
    image: botAdvanced,
    bots: [
      { id: "a1", name: "Magnus Mini", rating: 1800, description: "Inspired by the World Champion", difficulty: "Advanced" },
      { id: "a2", name: "Calculation King", rating: 1850, description: "Calculates deeply", difficulty: "Advanced" },
      { id: "a3", name: "Pressure Pro", rating: 1900, description: "Constant pressure", difficulty: "Advanced" },
      { id: "a4", name: "Sacrifice Sage", rating: 1950, description: "Bold sacrifices", difficulty: "Advanced" },
      { id: "a5", name: "Complex Clara", rating: 2000, description: "Loves complexity", difficulty: "Advanced" },
      { id: "a6", name: "Precise Percy", rating: 2050, description: "Extremely accurate", difficulty: "Advanced" },
      { id: "a7", name: "Dynamic Dave", rating: 2100, description: "Dynamic play", difficulty: "Advanced" },
      { id: "a8", name: "Strategy Steve", rating: 2150, description: "Deep strategist", difficulty: "Advanced" },
      { id: "a9", name: "Aggressive Anna", rating: 2200, description: "Relentless attacker", difficulty: "Advanced" },
      { id: "a10", name: "Balance Bob", rating: 2250, description: "Perfectly balanced", difficulty: "Advanced" },
    ],
  },
  expert: {
    icon: Crown,
    color: "text-yellow-500",
    image: botAdvanced,
    bots: [
      { id: "e1", name: "Expert Eva", rating: 2300, description: "Tournament veteran", difficulty: "Expert" },
      { id: "e2", name: "Crushing Chris", rating: 2350, description: "Crushes opponents", difficulty: "Expert" },
      { id: "e3", name: "Brilliant Ben", rating: 2400, description: "Brilliant combinations", difficulty: "Expert" },
      { id: "e4", name: "Intuitive Iris", rating: 2450, description: "Strong intuition", difficulty: "Expert" },
      { id: "e5", name: "Perfect Play", rating: 2500, description: "Near perfection", difficulty: "Expert" },
      { id: "e6", name: "Theory Master", rating: 2550, description: "Opening theory expert", difficulty: "Expert" },
      { id: "e7", name: "Endgame Guru", rating: 2600, description: "Endgame master", difficulty: "Expert" },
      { id: "e8", name: "Time Wizard", rating: 2650, description: "Time management pro", difficulty: "Expert" },
      { id: "e9", name: "Resourceful Ron", rating: 2700, description: "Always finds resources", difficulty: "Expert" },
      { id: "e10", name: "Merciless Mary", rating: 2750, description: "Shows no mercy", difficulty: "Expert" },
    ],
  },
  master: {
    icon: Sparkles,
    color: "text-gold",
    image: botGrandmaster,
    bots: [
      { id: "m1", name: "Master Mind", rating: 2800, description: "International Master level", difficulty: "Master" },
      { id: "m2", name: "Alpha Chess", rating: 2850, description: "Superhuman play", difficulty: "Master" },
      { id: "m3", name: "Strategic Genius", rating: 2900, description: "Genius strategist", difficulty: "Master" },
      { id: "m4", name: "Tactical Thunder", rating: 2950, description: "Lightning tactics", difficulty: "Master" },
      { id: "m5", name: "Deep Blue Jr", rating: 3000, description: "Computer-like accuracy", difficulty: "Master" },
      { id: "m6", name: "Perfect Storm", rating: 3050, description: "Devastating attacks", difficulty: "Master" },
      { id: "m7", name: "Chess Titan", rating: 3100, description: "Titanic strength", difficulty: "Master" },
      { id: "m8", name: "Supreme Mind", rating: 3150, description: "Supreme understanding", difficulty: "Master" },
      { id: "m9", name: "Ultimate Pro", rating: 3200, description: "Professional level", difficulty: "Master" },
      { id: "m10", name: "Elite Champion", rating: 3250, description: "Elite performer", difficulty: "Master" },
    ],
  },
  grandmaster: {
    icon: Crown,
    color: "text-gold",
    image: botGrandmaster,
    bots: [
      { id: "g1", name: "Stockfish Lite", rating: 3300, description: "Engine-based GM", difficulty: "Grandmaster" },
      { id: "g2", name: "Komodo King", rating: 3350, description: "Positional perfection", difficulty: "Grandmaster" },
      { id: "g3", name: "Leela Zero", rating: 3400, description: "Neural network beast", difficulty: "Grandmaster" },
      { id: "g4", name: "AlphaZero Jr", rating: 3450, description: "Self-taught genius", difficulty: "Grandmaster" },
      { id: "g5", name: "Garry Bot", rating: 3500, description: "Named after Kasparov", difficulty: "Grandmaster" },
      { id: "g6", name: "Bobby Fischer AI", rating: 3550, description: "Fischer's spirit", difficulty: "Grandmaster" },
      { id: "g7", name: "Tal's Ghost", rating: 3600, description: "Sacrificial magic", difficulty: "Grandmaster" },
      { id: "g8", name: "Capablanca Bot", rating: 3650, description: "Endgame wizard", difficulty: "Grandmaster" },
      { id: "g9", name: "Morphy Machine", rating: 3700, description: "Tactical brilliance", difficulty: "Grandmaster" },
      { id: "g10", name: "The Invincible", rating: 3750, description: "Nearly unbeatable", difficulty: "Grandmaster" },
    ],
  },
  anime: {
    icon: Sparkles,
    color: "text-secondary",
    image: botAnime,
    bots: [
      { id: "an1", name: "Hikaru No Go", rating: 2000, description: "Strategic anime spirit", difficulty: "Anime" },
      { id: "an2", name: "Code Geass", rating: 2100, description: "Strategic mastermind", difficulty: "Anime" },
      { id: "an3", name: "Light Yagami", rating: 2200, description: "Mind games master", difficulty: "Anime" },
      { id: "an4", name: "L Detective", rating: 2300, description: "Analytical genius", difficulty: "Anime" },
      { id: "an5", name: "Senku Stone", rating: 2400, description: "Scientific approach", difficulty: "Anime" },
      { id: "an6", name: "Lelouch Bot", rating: 2500, description: "Zero strategy", difficulty: "Anime" },
      { id: "an7", name: "Edward Elric", rating: 2600, description: "Alchemist tactician", difficulty: "Anime" },
      { id: "an8", name: "Shikamaru AI", rating: 2700, description: "200 IQ plays", difficulty: "Anime" },
      { id: "an9", name: "Saitama Chess", rating: 2800, description: "One move victory", difficulty: "Anime" },
      { id: "an10", name: "Goku Ultra", rating: 2900, description: "Ultra instinct moves", difficulty: "Anime" },
    ],
  },
};

const Bots = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("beginner");

  const handlePlayBot = (bot: Bot) => {
    // Navigate to game page with selected bot
    navigate("/game", { state: { selectedBot: bot } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Swords className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Chess Bots
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-card py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Challenge Our AI Bots
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From beginner to grandmaster level - find the perfect opponent to match your skill
          </p>
        </div>
      </section>

      {/* Bots Grid */}
      <main className="container mx-auto px-4 py-12">
        <Tabs defaultValue="beginner" className="w-full" onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="expert">Expert</TabsTrigger>
            <TabsTrigger value="master">Master</TabsTrigger>
            <TabsTrigger value="grandmaster">GM</TabsTrigger>
            <TabsTrigger value="anime">Anime</TabsTrigger>
          </TabsList>

          {Object.entries(botCategories).map(([category, { icon: Icon, color, image, bots }]) => (
            <TabsContent key={category} value={category}>
              <div className="mb-6 flex items-center gap-3">
                <Icon className={`w-8 h-8 ${color}`} />
                <h3 className="text-2xl font-bold capitalize">{category} Bots</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bots.map((bot) => (
                  <Card
                    key={bot.id}
                    className="bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-glow overflow-hidden"
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      <img
                        src={bot.image || image}
                        alt={bot.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{bot.name}</CardTitle>
                          <Badge variant="outline" className="mt-2">
                            {bot.rating} ELO
                          </Badge>
                        </div>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <CardDescription className="mt-2">
                        {bot.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full gap-2 shadow-glow"
                        onClick={() => handlePlayBot(bot)}
                      >
                        <Swords className="w-4 h-4" />
                        Play Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
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
                <li><a href="/#play" className="hover:text-primary transition-colors">Quick Match</a></li>
                <li><a href="/bots" className="hover:text-primary transition-colors">Play vs Bot</a></li>
                <li><a href="/#play" className="hover:text-primary transition-colors">Play vs Friend</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/#community" className="hover:text-primary transition-colors">Chat Room</a></li>
                <li><a href="/#community" className="hover:text-primary transition-colors">Forums</a></li>
                <li><a href="/#tournament" className="hover:text-primary transition-colors">Tournaments</a></li>
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

export default Bots;
