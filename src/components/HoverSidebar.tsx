import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Users, Store, Puzzle, MessageSquare, User, Trophy, Award, Bot, LogOut, MessagesSquare, GraduationCap, Newspaper, History, Library } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HoverSidebarProps {
  user: any;
  currentAvatar: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HoverSidebar({ user, currentAvatar, isOpen, onClose }: HoverSidebarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate('/auth');
      onClose();
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

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
        <ScrollArea className="h-full">
          <div className="pt-20 px-6 pb-6 space-y-6">
            {/* User Profile Section */}
            <Card className="p-5 bg-gradient-card border-border/50">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-primary text-3xl">
                        {getAvatarIcon(currentAvatar)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base mb-1">
                        {user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/my-profile');
                    onClose();
                  }}
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </Button>

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
                    navigate('/community');
                    onClose();
                  }}
                >
                  <MessagesSquare className="w-5 h-5" />
                  <span>Community</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/feed');
                    onClose();
                  }}
                >
                  <Newspaper className="w-5 h-5" />
                  <span>Feed</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/blog');
                    onClose();
                  }}
                >
                  <Library className="w-5 h-5" />
                  <span>Blog</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/leaderboards');
                    onClose();
                  }}
                >
                  <Trophy className="w-5 h-5" />
                  <span>Leaderboards</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/game-history');
                    onClose();
                  }}
                >
                  <History className="w-5 h-5" />
                  <span>Game History</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/certificates');
                    onClose();
                  }}
                >
                  <Award className="w-5 h-5" />
                  <span>Certificates</span>
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

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/bots');
                    onClose();
                  }}
                >
                  <Bot className="w-5 h-5" />
                  <span>Bots</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/coach');
                    onClose();
                  }}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>AI Coach</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
  );
}
