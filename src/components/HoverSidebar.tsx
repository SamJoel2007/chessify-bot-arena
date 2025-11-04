import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Users, Store, Puzzle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAvatarIcon } from "@/lib/avatarUtils";

interface HoverSidebarProps {
  user: any;
  currentAvatar: string | null;
}

export function HoverSidebar({ user, currentAvatar }: HoverSidebarProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Extended hover trigger zone - spans from left edge */}
      <div 
        className="fixed top-0 left-0 w-80 h-full z-40 pointer-events-none"
        onMouseEnter={() => setIsHovered(true)}
      >
        <div 
          className="pointer-events-auto w-full h-full"
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Sidebar */}
          <div
            className={`h-screen w-72 bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out ${
              isHovered ? "translate-x-0" : "-translate-x-full"
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

              {/* Navigation Buttons */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    // TODO: Implement notifications
                    setIsHovered(false);
                  }}
                >
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    // TODO: Implement friends
                    setIsHovered(false);
                  }}
                >
                  <Users className="w-5 h-5" />
                  <span>Friends</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate('/purchase-coins');
                    setIsHovered(false);
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
                    setIsHovered(false);
                  }}
                >
                  <Puzzle className="w-5 h-5" />
                  <span>Puzzles</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
