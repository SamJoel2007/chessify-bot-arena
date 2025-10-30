import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, User, Palette, Coins } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  setCoins: (coins: number) => void;
}

const shopItems = {
  bots: [
    { id: 1, name: "Dragon Knight", price: 600, icon: "🐉" },
    { id: 2, name: "Cyber Warrior", price: 500, icon: "🤖" },
    { id: 3, name: "Wizard Master", price: 700, icon: "🧙‍♂️" },
  ],
  avatars: [
    { id: 1, name: "Cool King", price: 200, icon: "👑" },
    { id: 2, name: "Knight Helmet", price: 150, icon: "⚔️" },
    { id: 3, name: "Chess Crown", price: 250, icon: "♛" },
  ],
  themes: [
    { id: 1, name: "Midnight Blue", price: 300, color: "from-blue-900 to-blue-600" },
    { id: 2, name: "Royal Purple", price: 350, color: "from-purple-900 to-purple-600" },
    { id: 3, name: "Emerald Dream", price: 300, color: "from-emerald-900 to-emerald-600" },
  ],
};

export const ShopModal = ({ isOpen, onClose, coins, setCoins }: ShopModalProps) => {
  const handlePurchase = async (item: any, category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to make purchases");
      return;
    }

    const { data, error } = await supabase.rpc('handle_purchase', {
      p_item_type: category,
      p_item_id: item.id.toString(),
      p_item_name: item.name,
      p_item_data: { icon: item.icon, color: item.color },
      p_price: item.price
    }) as { data: { success: boolean; error?: string; coins?: number } | null; error: any };

    if (error || !data?.success) {
      toast.error((data as any)?.error || "Purchase failed");
      return;
    }

    setCoins((data as any).coins);
    toast.success(`Purchased ${item.name}!`);
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
              {shopItems.bots.map((bot) => (
                <Card key={bot.id} className="p-4 bg-card/50">
                  <div className="text-5xl mb-3 text-center">{bot.icon}</div>
                  <h3 className="font-bold text-center mb-2">{bot.name}</h3>
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={() => handlePurchase(bot, "bot")}
                  >
                    <Coins className="w-4 h-4 text-gold" />
                    {bot.price}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="avatars" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {shopItems.avatars.map((avatar) => (
                <Card key={avatar.id} className="p-4 bg-card/50">
                  <div className="text-5xl mb-3 text-center">{avatar.icon}</div>
                  <h3 className="font-bold text-center mb-2">{avatar.name}</h3>
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={() => handlePurchase(avatar, "avatar")}
                  >
                    <Coins className="w-4 h-4 text-gold" />
                    {avatar.price}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="themes" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {shopItems.themes.map((theme) => (
                <Card key={theme.id} className="p-4 bg-card/50">
                  <div
                    className={`h-24 mb-3 rounded-lg bg-gradient-to-br ${theme.color}`}
                  />
                  <h3 className="font-bold text-center mb-2">{theme.name}</h3>
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={() => handlePurchase(theme, "theme")}
                  >
                    <Coins className="w-4 h-4 text-gold" />
                    {theme.price}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
