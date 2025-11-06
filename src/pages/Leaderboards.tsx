import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Trophy, Medal, Crown } from "lucide-react";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
  current_avatar: string | null;
  rank: string;
}

export default function Leaderboards() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }

      // Fetch all users ordered by points
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, points, current_avatar, rank')
        .order('points', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="w-6 h-6 text-gold" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankBadgeColor = (position: number) => {
    if (position === 1) return "bg-gold/20 text-gold border-gold/30";
    if (position === 2) return "bg-gray-400/20 text-gray-400 border-gray-400/30";
    if (position === 3) return "bg-amber-600/20 text-amber-600 border-amber-600/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Leaderboards
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 bg-gradient-card border-primary/30">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-8 h-8 text-gold" />
            <div>
              <h2 className="text-2xl font-bold">Global Rankings</h2>
              <p className="text-sm text-muted-foreground">
                Top players ranked by points
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading leaderboards...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No players yet. Be the first to play!
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {users.map((user, index) => {
                  const position = index + 1;
                  const isCurrentUser = user.id === currentUserId;

                  return (
                    <Card
                      key={user.id}
                      className={`p-4 transition-all hover:shadow-md ${
                        isCurrentUser 
                          ? 'bg-primary/10 border-primary/50 shadow-glow' 
                          : 'bg-card/60 border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank Position */}
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getRankBadgeColor(position)}`}>
                          {getRankIcon(position) || (
                            <span className="font-bold text-lg">{position}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-primary text-2xl">
                            {getAvatarIcon(user.current_avatar)}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                              {user.username || 'Anonymous'}
                            </p>
                            {isCurrentUser && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {user.rank} • {user.points} points
                          </p>
                        </div>

                        {/* Points Badge */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                            <Trophy className="w-4 h-4 text-primary" />
                            <span className="font-bold text-primary">{user.points}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* Points Info Card */}
        <Card className="mt-6 p-6 bg-card/60 border-border/50">
          <h3 className="font-bold text-lg mb-4">How to Earn Points</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 font-bold">+10</span>
              </div>
              <p className="text-sm">Win an online matchmaking game</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 font-bold">+10</span>
              </div>
              <p className="text-sm">Win a game against a friend</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-500 font-bold">-5</span>
              </div>
              <p className="text-sm">Lose a competitive game</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
