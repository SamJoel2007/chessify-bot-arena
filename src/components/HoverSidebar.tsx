import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Users, Store, Puzzle, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAvatarIcon } from "@/lib/avatarUtils";

interface HoverSidebarProps {
  user: any;
  currentAvatar: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HoverSidebar({ user, currentAvatar, isOpen, onClose }: HoverSidebarProps) {
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div 
      className="fixed top-0 left-0 h-full z-40 pointer-events-none"
      onMouseLeave={onClose}
    >
      <div
        className={`h-screen w-72 bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out pointer-events-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
            <div className="p-6 space-y-6">
              {/* User Profile Section */}
              <Card className="p-4 bg-gradient-card border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-gradient-primary text-4xl">
                      {getAvatarIcon(currentAvatar)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/notifications');
                    onClose();
                  }}
                >
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/friends');
                    onClose();
                  }}
                >
                  <Users className="w-5 h-5" />
                  <span>Friends</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/messages');
                    onClose();
                  }}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Messages</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/purchase-coins');
                    onClose();
                  }}
                >
                  <Store className="w-5 h-5" />
                  <span>Credits Store</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/puzzles');
                    onClose();
                  }}
                >
                  <Puzzle className="w-5 h-5" />
                  <span>Puzzles</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
  );
}
