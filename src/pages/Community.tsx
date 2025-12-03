import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Crown, Menu, Store, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommunityChat } from "@/components/CommunityChat";
import { HoverSidebar } from "@/components/HoverSidebar";
import { AvatarSelector } from "@/components/AvatarSelector";
import { ShopModal } from "@/components/ShopModal";
import { NativeBannerAd } from "@/components/NativeBannerAd";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { toast } from "sonner";

const Community = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [coins, setCoins] = useState(1000);
  const [showSidebar, setShowSidebar] = useState(false);
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

    return () => {
      subscription.unsubscribe();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Chess Community - Chat & Connect with Players | Chessify</title>
        <meta name="description" content="Join the Chessify chess community. Chat with players worldwide, discuss strategies, share games, make chess friends, and connect with fellow chess enthusiasts in our active community forum." />
        <meta name="keywords" content="chess community, chess chat, chess forums, chess social, meet chess players, chess friends, chess discussion, chess players online, chess community chat, connect with chess players, chess social network, chess club online, chess enthusiasts, chess talk, chess strategy discussion, chess tips sharing" />
        <link rel="canonical" href="https://chessify.lovable.app/community" />
      </Helmet>
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
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent cursor-pointer" onClick={() => navigate('/')}>
                Chessify
              </h1>
            </div>
            
            <nav className="hidden md:flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
              >
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/bots')}
              >
                Bots
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/puzzles')}
              >
                Puzzles
              </Button>
              <Button
                variant="default"
              >
                Community
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              className="gap-1 md:gap-2 px-2 md:px-4"
              size="sm"
              onClick={() => user ? setShowShop(true) : navigate('/auth')}
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
            {user ? (
              <Button variant="outline" onClick={handleSignOut} size="sm" className="px-2 md:px-4 text-xs md:text-sm hidden sm:flex">
                Sign Out
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")} size="sm" className="px-2 md:px-4 text-xs md:text-sm">
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">In</span>
                </Button>
                <Button variant="default" onClick={() => navigate("/auth")} size="sm" className="px-2 md:px-4 text-xs md:text-sm hidden md:flex">
                  Sign Up
                </Button>
              </>
            )}
            <Avatar 
              className="cursor-pointer hover:ring-2 hover:ring-primary transition-all w-8 h-8 md:w-10 md:h-10" 
              onClick={() => user && setShowAvatarSelector(true)}
            >
              <AvatarFallback className="bg-gradient-primary text-2xl md:text-3xl">
                {getAvatarIcon(currentAvatar)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

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
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            Community Chat
          </h2>
          <p className="text-muted-foreground text-lg">
            Connect with fellow chess enthusiasts, share strategies, and discuss games
          </p>
        </div>

        {/* Community Chat Section */}
        <section className="max-w-5xl mx-auto">
          <CommunityChat />
        </section>

        {/* Native Banner Ad */}
        <NativeBannerAd />
      </main>
    </div>
  );
};

export default Community;
