import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Coins, Sparkles, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const coinBundles = [
  {
    id: 1,
    coins: 500,
    price: 99,
    icon: Coins,
    popular: false,
    bonus: 0,
  },
  {
    id: 2,
    coins: 1200,
    price: 199,
    icon: Sparkles,
    popular: true,
    bonus: 200,
    savings: "20% more coins!",
  },
  {
    id: 3,
    coins: 2500,
    price: 399,
    icon: Star,
    popular: false,
    bonus: 500,
    savings: "25% more coins!",
  },
  {
    id: 4,
    coins: 6000,
    price: 899,
    icon: Zap,
    popular: false,
    bonus: 1500,
    savings: "33% more coins!",
  },
];

const PurchaseCoins = () => {
  const navigate = useNavigate();

  const handlePurchase = (bundle: typeof coinBundles[0]) => {
    // TODO: Implement payment logic later
    console.log("Purchasing bundle:", bundle);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Purchase Coins
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Coins className="w-20 h-20 text-gold animate-pulse" />
                <Sparkles className="w-8 h-8 text-primary absolute -top-2 -right-2" />
              </div>
            </div>
            <h2 className="text-4xl font-bold">Choose Your Coin Bundle</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get more coins to unlock exclusive bots, avatars, and themes. Bigger bundles come with bonus coins!
            </p>
          </div>

          {/* Coin Bundles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coinBundles.map((bundle) => {
              const Icon = bundle.icon;
              const totalCoins = bundle.coins + bundle.bonus;
              
              return (
                <Card
                  key={bundle.id}
                  className={`relative transition-all hover:scale-105 ${
                    bundle.popular
                      ? "border-primary shadow-glow"
                      : "hover:border-primary/50"
                  }`}
                >
                  {bundle.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary">
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className={`p-4 rounded-full ${bundle.popular ? "bg-primary/20" : "bg-muted"}`}>
                        <Icon className={`w-8 h-8 ${bundle.popular ? "text-primary" : "text-foreground"}`} />
                      </div>
                    </div>
                    
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        <div className="flex items-center justify-center gap-2">
                          <Coins className="w-6 h-6 text-gold" />
                          <span>{totalCoins.toLocaleString()}</span>
                        </div>
                      </CardTitle>
                      {bundle.bonus > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {bundle.coins.toLocaleString()} + {bundle.bonus.toLocaleString()} bonus
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {bundle.savings}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="text-center">
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-primary">
                        ₹{bundle.price}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ₹{(bundle.price / totalCoins).toFixed(2)} per coin
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={bundle.popular ? "default" : "outline"}
                      onClick={() => handlePurchase(bundle)}
                    >
                      Purchase Now
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="mt-12 p-6 bg-card rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-4">Why Buy Coins?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold">Unlock Premium Bots</h4>
                <p className="text-sm text-muted-foreground">
                  Challenge advanced AI opponents with unique playing styles
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-secondary" />
                </div>
                <h4 className="font-semibold">Exclusive Avatars</h4>
                <p className="text-sm text-muted-foreground">
                  Customize your profile with unique avatar designs
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-semibold">Custom Themes</h4>
                <p className="text-sm text-muted-foreground">
                  Make your board beautiful with premium themes
                </p>
              </div>
            </div>
          </div>
        </div>
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

export default PurchaseCoins;
