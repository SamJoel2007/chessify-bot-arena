import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";
import { toast } from "sonner";

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onAvatarChange: (avatarId: string) => void;
}

const avatarIcons = [
  { id: "default", icon: "👤", name: "Default" },
  { id: "1", icon: "👑", name: "Cool King" },
  { id: "2", icon: "⚔️", name: "Knight Helmet" },
  { id: "3", icon: "♛", name: "Chess Crown" },
];

export const AvatarSelector = ({ isOpen, onClose, currentAvatar, onAvatarChange }: AvatarSelectorProps) => {
  const [purchasedAvatars, setPurchasedAvatars] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchPurchasedAvatars();
    }
  }, [isOpen]);

  const fetchPurchasedAvatars = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_purchases")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "avatar");

    if (data) {
      setPurchasedAvatars(["default", ...data.map(p => p.item_id)]);
    } else {
      setPurchasedAvatars(["default"]);
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to change your avatar");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ current_avatar: avatarId })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to change avatar");
      return;
    }

    onAvatarChange(avatarId);
    toast.success("Avatar changed successfully!");
    onClose();
  };

  const getAvatarIcon = (avatarId: string | null) => {
    const avatar = avatarIcons.find(a => a.id === (avatarId || "default"));
    return avatar?.icon || "👤";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-card">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="w-6 h-6" />
            Change Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {avatarIcons.map((avatar) => {
            const isPurchased = purchasedAvatars.includes(avatar.id);
            const isSelected = (currentAvatar || "default") === avatar.id;

            return (
              <Card
                key={avatar.id}
                className={`p-4 text-center transition-all cursor-pointer ${
                  isSelected ? "border-primary shadow-glow" : "border-border/50"
                } ${!isPurchased ? "opacity-50" : ""}`}
              >
                <div className="text-5xl mb-2">{avatar.icon}</div>
                <p className="text-sm font-medium mb-2">{avatar.name}</p>
                {isPurchased ? (
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleSelectAvatar(avatar.id)}
                    disabled={isSelected}
                  >
                    {isSelected ? "Current" : "Select"}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Locked</p>
                )}
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
