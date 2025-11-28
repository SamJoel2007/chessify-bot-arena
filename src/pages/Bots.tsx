import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Crown, ArrowLeft, Zap, Trophy, Star, Sparkles, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shopBots } from "@/lib/botUtils";
import { NativeBannerAd } from "@/components/NativeBannerAd";
import shopRookieRachel from "@/assets/shop/rookie-rachel.jpg";
import shopStarterSam from "@/assets/shop/starter-sam.jpg";
import shopNoviceNick from "@/assets/shop/novice-nick.jpg";
import shopTacticalTom from "@/assets/shop/tactical-tom.jpg";
import shopStrategicSteve from "@/assets/shop/strategic-steve.jpg";
import shopPositionalPaul from "@/assets/shop/positional-paul.jpg";
import shopMasterMarcus from "@/assets/shop/master-marcus.jpg";
import shopExpertEmma from "@/assets/shop/expert-emma.jpg";
import shopAdvancedAlex from "@/assets/shop/advanced-alex.jpg";
import shopGeniusGrace from "@/assets/shop/genius-grace.jpg";
import shopProdigyPeter from "@/assets/shop/prodigy-peter.jpg";
import shopEliteEva from "@/assets/shop/elite-eva.jpg";
import shopGrandmasterGary from "@/assets/shop/grandmaster-gary.jpg";
import shopSupremeSarah from "@/assets/shop/supreme-sarah.jpg";
import shopLegendaryLeo from "@/assets/shop/legendary-leo.jpg";
import shopMythicMaya from "@/assets/shop/mythic-maya.jpg";
import botBeginner from "@/assets/bot-beginner.jpg";
import botIntermediate from "@/assets/bot-intermediate.jpg";
import botAdvanced from "@/assets/bot-advanced.jpg";
import botGrandmaster from "@/assets/bot-grandmaster.jpg";
import advancedMagnus from "@/assets/bots/advanced-01-magnus.jpg";
import advancedAlexander from "@/assets/bots/advanced-02-alexander.jpg";
import advancedVictor from "@/assets/bots/advanced-03-victor.jpg";
import advancedSebastian from "@/assets/bots/advanced-04-sebastian.jpg";
import advancedClara from "@/assets/bots/advanced-05-clara.jpg";
import advancedPercy from "@/assets/bots/advanced-06-percy.jpg";
import advancedDavid from "@/assets/bots/advanced-07-david.jpg";
import advancedSteven from "@/assets/bots/advanced-08-steven.jpg";
import advancedAnna from "@/assets/bots/advanced-09-anna.jpg";
import advancedRobert from "@/assets/bots/advanced-10-robert.jpg";
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
import intermediateTacticalTim from "@/assets/bots/intermediate-01-tactical-tim.jpg";
import intermediateStrategicSam from "@/assets/bots/intermediate-02-strategic-sam.jpg";
import intermediateEndgameEddie from "@/assets/bots/intermediate-03-endgame-eddie.jpg";
import intermediatePositionalPete from "@/assets/bots/intermediate-04-positional-pete.jpg";
import intermediateAttackAndy from "@/assets/bots/intermediate-05-attack-andy.jpg";
import intermediateDefenseDan from "@/assets/bots/intermediate-06-defense-dan.jpg";
import intermediateGambitGary from "@/assets/bots/intermediate-07-gambit-gary.jpg";
import intermediateCounterCarl from "@/assets/bots/intermediate-08-counter-carl.jpg";
import intermediatePatternPaul from "@/assets/bots/intermediate-09-pattern-paul.jpg";
import intermediateTempoTerry from "@/assets/bots/intermediate-10-tempo-terry.jpg";
import expertEva from "@/assets/bots/expert-01-eva.jpg";
import expertChristopher from "@/assets/bots/expert-02-christopher.jpg";
import expertBenjamin from "@/assets/bots/expert-03-benjamin.jpg";
import expertIris from "@/assets/bots/expert-04-iris.jpg";
import expertPatricia from "@/assets/bots/expert-05-patricia.jpg";
import expertTheodore from "@/assets/bots/expert-06-theodore.jpg";
import expertGrace from "@/assets/bots/expert-07-grace.jpg";
import expertWilliam from "@/assets/bots/expert-08-william.jpg";
import expertRonald from "@/assets/bots/expert-09-ronald.jpg";
import expertMary from "@/assets/bots/expert-10-mary.jpg";
import masterMarcus from "@/assets/bots/master-01-marcus.jpg";
import masterAlexis from "@/assets/bots/master-02-alexis.jpg";
import masterGenevieve from "@/assets/bots/master-03-genevieve.jpg";
import masterThomas from "@/assets/bots/master-04-thomas.jpg";
import masterJames from "@/assets/bots/master-05-james.jpg";
import masterStella from "@/assets/bots/master-06-stella.jpg";
import masterTitus from "@/assets/bots/master-07-titus.jpg";
import masterSamantha from "@/assets/bots/master-08-samantha.jpg";
import masterUlysses from "@/assets/bots/master-09-ulysses.jpg";
import masterEleanor from "@/assets/bots/master-10-eleanor.jpg";
import gmStephanie from "@/assets/bots/gm-01-stephanie.jpg";
import gmKevin from "@/assets/bots/gm-02-kevin.jpg";
import gmLeela from "@/assets/bots/gm-03-leela.jpg";
import gmAlexander from "@/assets/bots/gm-04-alexander.jpg";
import gmGarry from "@/assets/bots/gm-05-garry.jpg";
import gmBobby from "@/assets/bots/gm-06-bobby.jpg";
import gmMikhail from "@/assets/bots/gm-07-mikhail.jpg";
import gmJose from "@/assets/bots/gm-08-jose.jpg";
import gmPaul from "@/assets/bots/gm-09-paul.jpg";
import gmVictoria from "@/assets/bots/gm-10-victoria.jpg";

interface Bot {
  id: string;
  name: string;
  rating: number;
  description: string;
  difficulty: string;
  image?: string;
  isPurchased?: boolean;
}

const botCategories: Record<string, { 
  icon: any; 
  color: string; 
  image: string; 
  bots: Bot[] 
}> = {
  beginner: {
    icon: Star,
    color: "text-green-500",
    image: botBeginner,
    bots: [
      {
        id: "b1",
        name: "Mark",
        rating: 400,
        description: "Just learning the basics",
        difficulty: "Beginner",
        image: beginnerPawnPusher,
      },
      {
        id: "b2",
        name: "Ashley",
        rating: 450,
        description: "Loves castling early",
        difficulty: "Beginner",
        image: beginnerCastleKeeper,
      },
      {
        id: "b3",
        name: "Chris",
        rating: 500,
        description: "Enjoys knight moves",
        difficulty: "Beginner",
        image: beginnerKnightNovice,
      },
      {
        id: "b4",
        name: "Ada Wong",
        rating: 550,
        description: "Diagonal specialist",
        difficulty: "Beginner",
        image: beginnerBishopBuddy,
      },
      {
        id: "b5",
        name: "Ravi",
        rating: 600,
        description: "Learning rook endgames",
        difficulty: "Beginner",
        image: beginnerRookRookie,
      },
      {
        id: "b6",
        name: "Anna Williams",
        rating: 650,
        description: "Protective player",
        difficulty: "Beginner",
        image: beginnerQueensGuard,
      },
      {
        id: "b7",
        name: "Gojo",
        rating: 700,
        description: "Defensive minded",
        difficulty: "Beginner",
        image: beginnerKingsShadow,
      },
      {
        id: "b8",
        name: "Sahana",
        rating: 750,
        description: "Loves giving checks",
        difficulty: "Beginner",
        image: beginnerCheckChaser,
      },
      {
        id: "b9",
        name: "Leon Kennedy",
        rating: 800,
        description: "Controls the center",
        difficulty: "Beginner",
        image: beginnerCenterControl,
      },
      {
        id: "b10",
        name: "Emi",
        rating: 850,
        description: "Learning openings",
        difficulty: "Beginner",
        image: beginnerOpeningExplorer,
      },
    ],
  },
  intermediate: {
    icon: Zap,
    color: "text-blue-500",
    image: botIntermediate,
    bots: [
      {
        id: "i1",
        name: "Timothy",
        rating: 1000,
        description: "Spots basic tactics",
        difficulty: "Intermediate",
        image: intermediateTacticalTim,
      },
      {
        id: "i2",
        name: "Samuel",
        rating: 1100,
        description: "Plans ahead",
        difficulty: "Intermediate",
        image: intermediateStrategicSam,
      },
      {
        id: "i3",
        name: "Edward",
        rating: 1200,
        description: "Strong finisher",
        difficulty: "Intermediate",
        image: intermediateEndgameEddie,
      },
      {
        id: "i4",
        name: "Peter",
        rating: 1300,
        description: "Loves good positions",
        difficulty: "Intermediate",
        image: intermediatePositionalPete,
      },
      {
        id: "i5",
        name: "Andrew",
        rating: 1400,
        description: "Aggressive player",
        difficulty: "Intermediate",
        image: intermediateAttackAndy,
      },
      {
        id: "i6",
        name: "Daniel",
        rating: 1450,
        description: "Solid defender",
        difficulty: "Intermediate",
        image: intermediateDefenseDan,
      },
      {
        id: "i7",
        name: "Gary",
        rating: 1500,
        description: "Loves gambits",
        difficulty: "Intermediate",
        image: intermediateGambitGary,
      },
      {
        id: "i8",
        name: "Carl",
        rating: 1550,
        description: "Counter-attack expert",
        difficulty: "Intermediate",
        image: intermediateCounterCarl,
      },
      {
        id: "i9",
        name: "Paul",
        rating: 1600,
        description: "Recognizes patterns",
        difficulty: "Intermediate",
        image: intermediatePatternPaul,
      },
      {
        id: "i10",
        name: "Terry",
        rating: 1650,
        description: "Never wastes time",
        difficulty: "Intermediate",
        image: intermediateTempoTerry,
      },
    ],
  },
  advanced: {
    icon: Trophy,
    color: "text-purple-500",
    image: botAdvanced,
    bots: [
      {
        id: "a1",
        name: "Magnus",
        rating: 1800,
        description: "Tactical genius who punishes mistakes",
        difficulty: "Advanced",
        image: advancedMagnus,
      },
      {
        id: "a2",
        name: "Alexander",
        rating: 1850,
        description: "Positional master with deadly precision",
        difficulty: "Advanced",
        image: advancedAlexander,
      },
      {
        id: "a3",
        name: "Victor",
        rating: 1900,
        description: "Aggressive attacker with sharp calculations",
        difficulty: "Advanced",
        image: advancedVictor,
      },
      {
        id: "a4",
        name: "Sebastian",
        rating: 1950,
        description: "Endgame specialist with perfect technique",
        difficulty: "Advanced",
        image: advancedSebastian,
      },
      {
        id: "a5",
        name: "Clara",
        rating: 2000,
        description: "Strategic mastermind with deep understanding",
        difficulty: "Advanced",
        image: advancedClara,
      },
      {
        id: "a6",
        name: "Percy",
        rating: 2050,
        description: "Opening theory expert with vast knowledge",
        difficulty: "Advanced",
        image: advancedPercy,
      },
      {
        id: "a7",
        name: "David",
        rating: 2100,
        description: "Dynamic player with creative ideas",
        difficulty: "Advanced",
        image: advancedDavid,
      },
      {
        id: "a8",
        name: "Steven",
        rating: 2150,
        description: "Solid defender who counterattacks brilliantly",
        difficulty: "Advanced",
        image: advancedSteven,
      },
      {
        id: "a9",
        name: "Anna",
        rating: 2200,
        description: "Grandmaster-level calculation and intuition",
        difficulty: "Advanced",
        image: advancedAnna,
      },
      {
        id: "a10",
        name: "Robert",
        rating: 2250,
        description: "Near-perfect play with minimal errors",
        difficulty: "Advanced",
        image: advancedRobert,
      },
    ],
  },
  expert: {
    icon: Crown,
    color: "text-yellow-500",
    image: botAdvanced,
    bots: [
      {
        id: "e1",
        name: "Eva",
        rating: 2300,
        description: "Tournament veteran with flawless technique",
        difficulty: "Expert",
        image: expertEva,
      },
      {
        id: "e2",
        name: "Christopher",
        rating: 2350,
        description: "Crushes opponents with relentless precision",
        difficulty: "Expert",
        image: expertChristopher,
      },
      {
        id: "e3",
        name: "Benjamin",
        rating: 2400,
        description: "Brilliant combinational vision and calculation",
        difficulty: "Expert",
        image: expertBenjamin,
      },
      {
        id: "e4",
        name: "Iris",
        rating: 2450,
        description: "Intuition backed by concrete calculation",
        difficulty: "Expert",
        image: expertIris,
      },
      {
        id: "e5",
        name: "Patricia",
        rating: 2500,
        description: "Near-perfect positional understanding",
        difficulty: "Expert",
        image: expertPatricia,
      },
      {
        id: "e6",
        name: "Theodore",
        rating: 2550,
        description: "Walking opening encyclopedia with deep preparation",
        difficulty: "Expert",
        image: expertTheodore,
      },
      {
        id: "e7",
        name: "Grace",
        rating: 2600,
        description: "Endgame mastery at grandmaster level",
        difficulty: "Expert",
        image: expertGrace,
      },
      {
        id: "e8",
        name: "William",
        rating: 2650,
        description: "Elite time management and strategic depth",
        difficulty: "Expert",
        image: expertWilliam,
      },
      {
        id: "e9",
        name: "Ronald",
        rating: 2700,
        description: "Always finds the most resourceful defense",
        difficulty: "Expert",
        image: expertRonald,
      },
      {
        id: "e10",
        name: "Mary",
        rating: 2750,
        description: "Shows absolutely no mercy or weaknesses",
        difficulty: "Expert",
        image: expertMary,
      },
    ],
  },
  master: {
    icon: Sparkles,
    color: "text-gold",
    image: botGrandmaster,
    bots: [
      {
        id: "m1",
        name: "Marcus",
        rating: 2800,
        description: "International Master level with intense focus",
        difficulty: "Master",
        image: masterMarcus,
      },
      {
        id: "m2",
        name: "Alexis",
        rating: 2850,
        description: "Superhuman play with piercing analytical mind",
        difficulty: "Master",
        image: masterAlexis,
      },
      {
        id: "m3",
        name: "Genevieve",
        rating: 2900,
        description: "Genius strategist with calculating brilliance",
        difficulty: "Master",
        image: masterGenevieve,
      },
      {
        id: "m4",
        name: "Thomas",
        rating: 2950,
        description: "Lightning tactics with computer-like speed",
        difficulty: "Master",
        image: masterThomas,
      },
      {
        id: "m5",
        name: "James",
        rating: 3000,
        description: "Computer-like accuracy with perfect precision",
        difficulty: "Master",
        image: masterJames,
      },
      {
        id: "m6",
        name: "Stella",
        rating: 3050,
        description: "Devastating attacks with ruthless efficiency",
        difficulty: "Master",
        image: masterStella,
      },
      {
        id: "m7",
        name: "Titus",
        rating: 3100,
        description: "Titanic strength with commanding presence",
        difficulty: "Master",
        image: masterTitus,
      },
      {
        id: "m8",
        name: "Samantha",
        rating: 3150,
        description: "Supreme understanding with serene wisdom",
        difficulty: "Master",
        image: masterSamantha,
      },
      {
        id: "m9",
        name: "Ulysses",
        rating: 3200,
        description: "Professional level with experienced mastery",
        difficulty: "Master",
        image: masterUlysses,
      },
      {
        id: "m10",
        name: "Eleanor",
        rating: 3250,
        description: "Elite performer with concentrated excellence",
        difficulty: "Master",
        image: masterEleanor,
      },
    ],
  },
  grandmaster: {
    icon: Crown,
    color: "text-gold",
    image: botGrandmaster,
    bots: [
      {
        id: "g1",
        name: "Stephanie",
        rating: 3300,
        description: "Engine-based GM with machine-like precision",
        difficulty: "Grandmaster",
        image: gmStephanie,
      },
      {
        id: "g2",
        name: "Kevin",
        rating: 3350,
        description: "Positional perfection with flawless understanding",
        difficulty: "Grandmaster",
        image: gmKevin,
      },
      {
        id: "g3",
        name: "Leela",
        rating: 3400,
        description: "Neural network beast with AI-level dominance",
        difficulty: "Grandmaster",
        image: gmLeela,
      },
      {
        id: "g4",
        name: "Alexander",
        rating: 3450,
        description: "Self-taught genius with brilliant intuition",
        difficulty: "Grandmaster",
        image: gmAlexander,
      },
      {
        id: "g5",
        name: "Garry",
        rating: 3500,
        description: "Named after Kasparov, legendary mastery",
        difficulty: "Grandmaster",
        image: gmGarry,
      },
      {
        id: "g6",
        name: "Bobby",
        rating: 3550,
        description: "Fischer's spirit with unmatched genius",
        difficulty: "Grandmaster",
        image: gmBobby,
      },
      {
        id: "g7",
        name: "Mikhail",
        rating: 3600,
        description: "Sacrificial magic with artistic brilliance",
        difficulty: "Grandmaster",
        image: gmMikhail,
      },
      {
        id: "g8",
        name: "Jose",
        rating: 3650,
        description: "Endgame wizard with theoretical mastery",
        difficulty: "Grandmaster",
        image: gmJose,
      },
      {
        id: "g9",
        name: "Paul",
        rating: 3700,
        description: "Tactical brilliance with sharp precision",
        difficulty: "Grandmaster",
        image: gmPaul,
      },
      {
        id: "g10",
        name: "Victoria",
        rating: 3750,
        description: "Nearly unbeatable with absolute dominance",
        difficulty: "Grandmaster",
        image: gmVictoria,
      },
    ],
  },
};

const Bots = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("beginner");
  const [allBotCategories, setAllBotCategories] = useState(botCategories);

  useEffect(() => {
    fetchPurchasedBots();
  }, []);

  const fetchPurchasedBots = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAllBotCategories(botCategories);
      return;
    }

    const { data: purchasedBots } = await supabase
      .from("user_purchases")
      .select("item_id, item_name, item_data")
      .eq("user_id", user.id)
      .eq("item_type", "bot");

    if (purchasedBots && purchasedBots.length > 0) {
      const updatedCategories = { ...botCategories };
      
      // Add purchased bots to their respective categories
      purchasedBots.forEach(pb => {
        const botData = pb.item_data as any;
        const categoryKey = (botData.category || "intermediate").toString();
        const category = categoryKey as keyof typeof updatedCategories;
        
        if (category && updatedCategories[category]) {
          // Map bot IDs to their imported images
          const botImageMap: Record<string, string> = {
            "shop-bot-b1": shopRookieRachel,
            "shop-bot-b2": shopStarterSam,
            "shop-bot-b3": shopNoviceNick,
            "shop-bot-i1": shopTacticalTom,
            "shop-bot-i2": shopStrategicSteve,
            "shop-bot-i3": shopPositionalPaul,
            "shop-bot-a1": shopMasterMarcus,
            "shop-bot-a2": shopExpertEmma,
            "shop-bot-a3": shopAdvancedAlex,
            "shop-bot-e1": shopGeniusGrace,
            "shop-bot-e2": shopProdigyPeter,
            "shop-bot-e3": shopEliteEva,
            "shop-bot-m1": shopGrandmasterGary,
            "shop-bot-m2": shopSupremeSarah,
            "shop-bot-g1": shopLegendaryLeo,
            "shop-bot-g2": shopMythicMaya,
          };
          
          const newBot: Bot = {
            id: pb.item_id,
            name: pb.item_name,
            rating: botData.rating || 1000,
            description: botData.description || "Purchased chess bot",
            difficulty: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
            image: botData.image || botImageMap[pb.item_id],
            isPurchased: true,
          };
          
          // Check if bot doesn't already exist
          const exists = updatedCategories[category].bots.some(b => b.id === newBot.id);
          if (!exists) {
            updatedCategories[category].bots.push(newBot);
            // Sort by rating
            updatedCategories[category].bots.sort((a, b) => a.rating - b.rating);
          }
        }
      });
      
      setAllBotCategories(updatedCategories);
    }
  };

  const handlePlayBot = (bot: Bot) => {
    // Navigate to game page with selected bot
    navigate("/game", { state: { selectedBot: bot } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Chess AI Bots - Play Against Computer | Chessify</title>
        <meta name="description" content="Challenge AI chess bots from beginner to grandmaster level. Practice against computer opponents with various ELO ratings: beginner (400-800), intermediate (900-1400), advanced (1500-2000), expert (2100-2400), master (2500-2800), and grandmaster (2900+) difficulty levels." />
        <meta name="keywords" content="chess AI, chess bot, play chess against computer, chess difficulty levels, ELO rated chess bots, beginner chess bot, intermediate chess bot, advanced chess bot, expert chess bot, master chess bot, grandmaster chess bot, chess practice, chess vs AI, chess vs computer, computer chess opponents" />
        <link rel="canonical" href="https://chessify.lovable.app/bots" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-2 md:px-4 py-3 md:py-4 flex items-center justify-between max-w-full">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="w-8 h-8 md:w-10 md:h-10">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Swords className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent hidden sm:block">
                Chess Bots
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} size="sm" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
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
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="expert">Expert</TabsTrigger>
            <TabsTrigger value="master">Master</TabsTrigger>
            <TabsTrigger value="grandmaster">GM</TabsTrigger>
          </TabsList>

          {Object.entries(allBotCategories).map(([category, { icon: Icon, color, image, bots }]) => (
            <TabsContent key={category} value={category}>
              <div className="mb-6 flex items-center gap-3">
                <Icon className={`w-8 h-8 ${color}`} />
                <h3 className="text-2xl font-bold capitalize">{category} Bots</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bots.map((bot) => (
                  <Card
                    key={bot.id}
                    className="bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-glow overflow-hidden relative"
                  >
                    {bot.isPurchased && (
                      <Badge className="absolute top-2 right-2 z-10 bg-primary">
                        Shop Bot
                      </Badge>
                    )}
                    <div className="aspect-square w-full overflow-hidden bg-gradient-card">
                      {bot.image ? (
                        <img src={bot.image} alt={bot.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-8xl">
                          ♟️
                        </div>
                      )}
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
                      <CardDescription className="mt-2">{bot.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full gap-2 shadow-glow" onClick={() => handlePlayBot(bot)}>
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

      {/* Native Banner Ad */}
      <div className="container mx-auto px-4 py-12">
        <NativeBannerAd />
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Chessify</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your ultimate online chess platform for players of all levels
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-3">Play</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/#play" className="hover:text-primary transition-colors">
                    Quick Match
                  </a>
                </li>
                <li>
                  <a href="/bots" className="hover:text-primary transition-colors">
                    Play vs Bot
                  </a>
                </li>
                <li>
                  <a href="/#play" className="hover:text-primary transition-colors">
                    Play vs Friend
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/#community" className="hover:text-primary transition-colors">
                    Chat Room
                  </a>
                </li>
                <li>
                  <a href="/#community" className="hover:text-primary transition-colors">
                    Forums
                  </a>
                </li>
                <li>
                  <a href="/#tournament" className="hover:text-primary transition-colors">
                    Tournaments
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Learn Chess
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Strategy Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    FAQ
                  </a>
                </li>
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
