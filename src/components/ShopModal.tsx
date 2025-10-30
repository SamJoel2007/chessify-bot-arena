import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, User, Palette, Coins, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onCoinsUpdate: () => void;
}

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

interface ShopAvatar {
  id: string;
  name: string;
  price: number;
  icon: string;
  rarity: Rarity;
}

const rarityColors = {
  common: "from-gray-500 to-gray-600",
  uncommon: "from-green-500 to-green-600",
  rare: "from-blue-500 to-blue-600",
  epic: "from-purple-500 to-purple-600",
  legendary: "from-amber-500 to-amber-600",
};

const shopItems = {
  bots: [
    { id: "bot-1", name: "Dragon Knight", price: 600, icon: "🐉" },
    { id: "bot-2", name: "Cyber Warrior", price: 500, icon: "🤖" },
    { id: "bot-3", name: "Wizard Master", price: 700, icon: "🧙‍♂️" },
  ],
  avatars: [
    // Common
    { id: "1", name: "Knight Helmet", price: 100, icon: "⚔️", rarity: "common" as Rarity },
    { id: "2", name: "Chess Pawn", price: 120, icon: "♟️", rarity: "common" as Rarity },
    { id: "3", name: "Shield Bearer", price: 110, icon: "🛡️", rarity: "common" as Rarity },
    
    // Uncommon
    { id: "4", name: "Cool King", price: 200, icon: "👑", rarity: "uncommon" as Rarity },
    { id: "5", name: "Chess Crown", price: 220, icon: "♛", rarity: "uncommon" as Rarity },
    { id: "6", name: "Battle Axe", price: 210, icon: "🪓", rarity: "uncommon" as Rarity },
    
    // Rare
    { id: "7", name: "Fire Phoenix", price: 350, icon: "🔥", rarity: "rare" as Rarity },
    { id: "8", name: "Ice Crystal", price: 330, icon: "❄️", rarity: "rare" as Rarity },
    { id: "9", name: "Lightning Bolt", price: 340, icon: "⚡", rarity: "rare" as Rarity },
    
    // Epic
    { id: "10", name: "Dragon Soul", price: 500, icon: "🐲", rarity: "epic" as Rarity },
    { id: "11", name: "Magic Wand", price: 480, icon: "🪄", rarity: "epic" as Rarity },
    { id: "12", name: "Royal Scepter", price: 520, icon: "🔱", rarity: "epic" as Rarity },
  ] as ShopAvatar[],
  themes: [
    { id: "theme-1", name: "Midnight Blue", price: 300, color: "from-blue-900 to-blue-600" },
    { id: "theme-2", name: "Royal Purple", price: 350, color: "from-purple-900 to-purple-600" },
    { id: "theme-3", name: "Emerald Dream", price: 300, color: "from-emerald-900 to-emerald-600" },
  ],
};

export const ShopModal = ({ isOpen, onClose, coins, onCoinsUpdate }: ShopModalProps) => {
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPurchasedItems();
    }
  }, [isOpen]);

  const fetchPurchasedItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_purchases")
      .select("item_id")
      .eq("user_id", user.id);

    if (data) {
      setPurchasedItems(new Set(data.map(p => p.item_id)));
    }
  };

  const handlePurchase = async (item: any, category: string) => {
    if (loading) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to make purchases");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("handle_purchase", {
        p_item_type: category,
        p_item_id: item.id.toString(),
        p_item_name: item.name,
        p_item_data: { icon: item.icon, color: item.color },
        p_price: item.price,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; coins?: number };
      if (result?.success) {
        toast.success(`Purchased ${item.name}!`);
        setPurchasedItems(prev => new Set([...prev, item.id.toString()]));
        onCoinsUpdate();
      } else {
        toast.error(result?.error || "Purchase failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-card">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Coins className="w-6 h-6 text-gold" />
            Chessify Shop
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="bots" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bots" className="gap-2">
              <Bot className="w-4 h-4" />
              Bots
            </TabsTrigger>
            <TabsTrigger value="avatars" className="gap-2">
              <User className="w-4 h-4" />
              Avatars
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-2">
              <Palette className="w-4 h-4" />
              Themes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bots" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {shopItems.bots.map((bot) => {
                const isPurchased = purchasedItems.has(bot.id);
                return (
                  <Card key={bot.id} className="p-4 bg-card/50 relative">
                    {isPurchased && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className="text-5xl mb-3 text-center">{bot.icon}</div>
                    <h3 className="font-bold text-center mb-2">{bot.name}</h3>
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={() => handlePurchase(bot, "bot")}
                      disabled={isPurchased || loading}
                    >
                      {isPurchased ? (
                        "Owned"
                      ) : (
                        <>
                          <Coins className="w-4 h-4 text-gold" />
                          {bot.price}
                        </>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="avatars" className="mt-6">
            {["common", "uncommon", "rare", "epic", "legendary"].map((rarity) => {
              const avatarsInRarity = shopItems.avatars.filter(a => a.rarity === rarity);
              if (avatarsInRarity.length === 0) return null;
              
              return (
                <div key={rarity} className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${rarityColors[rarity as Rarity]}`} />
                    <h3 className="text-lg font-bold capitalize">{rarity}</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {avatarsInRarity.map((avatar) => {
                      const isPurchased = purchasedItems.has(avatar.id);
                      return (
                        <Card 
                          key={avatar.id} 
                          className="p-4 bg-card/50 relative border-2 transition-all hover:scale-105"
                          style={{
                            borderImage: `linear-gradient(135deg, var(--tw-gradient-stops)) 1`,
                            borderImageSlice: 1,
                          }}
                        >
                          {isPurchased && (
                            <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                          <div 
                            className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${rarityColors[avatar.rarity]} text-white`}
                          >
                            {avatar.rarity.toUpperCase()}
                          </div>
                          <div className="text-5xl mb-3 text-center mt-6">{avatar.icon}</div>
                          <h3 className="font-bold text-center mb-2">{avatar.name}</h3>
                          <Button
                            className="w-full gap-2"
                            variant="outline"
                            onClick={() => handlePurchase(avatar, "avatar")}
                            disabled={isPurchased || loading}
                          >
                            {isPurchased ? (
                              "Owned"
                            ) : (
                              <>
                                <Coins className="w-4 h-4 text-gold" />
                                {avatar.price}
                              </>
                            )}
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="themes" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {shopItems.themes.map((theme) => {
                const isPurchased = purchasedItems.has(theme.id);
                return (
                  <Card key={theme.id} className="p-4 bg-card/50 relative">
                    {isPurchased && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`h-24 mb-3 rounded-lg bg-gradient-to-br ${theme.color}`}
                    />
                    <h3 className="font-bold text-center mb-2">{theme.name}</h3>
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={() => handlePurchase(theme, "theme")}
                      disabled={isPurchased || loading}
                    >
                      {isPurchased ? (
                        "Owned"
                      ) : (
                        <>
                          <Coins className="w-4 h-4 text-gold" />
                          {theme.price}
                        </>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
