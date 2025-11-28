import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Trophy, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface GameRecord {
  id: string;
  white_username: string;
  black_username: string;
  white_player_id: string;
  black_player_id: string;
  winner_id: string | null;
  status: string;
  created_at: string;
  white_player_type: string | null;
  black_player_type: string | null;
}

export default function GameHistory() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        setUserId(user.id);

        // Fetch games where user participated
        const { data: gamesData, error } = await supabase
          .from('games')
          .select('*')
          .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setGames(gamesData || []);
      } catch (error) {
        console.error('Error fetching game history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameHistory();
  }, [navigate]);

  const getGameResult = (game: GameRecord) => {
    if (!userId) return 'Unknown';
    
    if (!game.winner_id) return 'Draw';
    
    if (game.winner_id === userId) return 'Won';
    return 'Lost';
  };

  const getResultBadge = (result: string) => {
    if (result === 'Won') return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Victory</Badge>;
    if (result === 'Lost') return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">Defeat</Badge>;
    return <Badge variant="outline">Draw</Badge>;
  };

  const getOpponentName = (game: GameRecord) => {
    if (!userId) return 'Unknown';
    return game.white_player_id === userId ? game.black_username : game.white_username;
  };

  const getPlayerColor = (game: GameRecord) => {
    if (!userId) return 'Unknown';
    return game.white_player_id === userId ? 'White' : 'Black';
  };

  const isVsBot = (game: GameRecord) => {
    return game.white_player_type === 'bot' || game.black_player_type === 'bot';
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Game History - Your Chess Match Records | Chessify</title>
        <meta name="description" content="View your complete chess game history. Review past chess games, match records, wins, losses, and draws. Track your chess progress and analyze your gameplay over time." />
        <meta name="keywords" content="chess game history, past chess games, chess match records, chess game results, chess wins and losses, chess game tracking, review chess games, chess gameplay history" />
        <link rel="canonical" href="https://chessify.lovable.app/game-history" />
      </Helmet>
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Game History</h1>
              <p className="text-sm text-muted-foreground">View your past games</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Your Games
              <Badge variant="secondary" className="ml-auto">{games.length} Games</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No games yet</h3>
                <p className="text-muted-foreground mb-4">Start playing to build your game history!</p>
                <Button onClick={() => navigate('/')}>Play Now</Button>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {games.map((game) => {
                    const result = getGameResult(game);
                    return (
                      <Card key={game.id} className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getResultBadge(result)}
                                {isVsBot(game) && (
                                  <Badge variant="outline" className="text-xs">vs Bot</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">vs {getOpponentName(game)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>Playing as {getPlayerColor(game)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(game.created_at), 'MMM d, yyyy')}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(game.created_at), 'h:mm a')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
