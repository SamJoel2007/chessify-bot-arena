import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Play, Trophy, Users } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string;
}

interface Match {
  id: string;
  round_number: number;
  player1_username: string;
  player2_username: string;
  player1_id: string;
  player2_id: string;
  status: string;
  game_id: string | null;
  winner_id: string | null;
}

interface Standing {
  id: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  rank: number | null;
}

export default function TournamentLobby() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [slug]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You must be signed in to access the tournament lobby",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    fetchTournamentData(user.id);
  };

  const fetchTournamentData = async (currentUserId: string) => {
    try {
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("registration_slug", slug)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Check if user is registered
      const { data: participant } = await supabase
        .from("tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentData.id)
        .eq("user_id", currentUserId)
        .single();

      if (!participant) {
        toast({
          title: "Not registered",
          description: "You must be registered to access the tournament lobby",
          variant: "destructive",
        });
        navigate(`/tournament/${slug}`);
        return;
      }

      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentData.id)
        .order("round_number", { ascending: true });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // Fetch standings
      const { data: standingsData, error: standingsError } = await supabase
        .from("tournament_standings")
        .select("*")
        .eq("tournament_id", tournamentData.id)
        .order("points", { ascending: false })
        .order("wins", { ascending: false });

      if (standingsError) throw standingsError;
      setStandings(standingsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startMatch = async (match: Match) => {
    if (!userId || !tournament) return;

    const isPlayer = match.player1_id === userId || match.player2_id === userId;
    if (!isPlayer) {
      toast({
        title: "Not your match",
        description: "You are not a participant in this match",
        variant: "destructive",
      });
      return;
    }

    if (match.game_id) {
      navigate(`/online-game/${match.game_id}`);
      return;
    }

    try {
      // Create game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({
          white_player_id: match.player1_id,
          black_player_id: match.player2_id,
          white_username: match.player1_username,
          black_username: match.player2_username,
          tournament_id: tournament.id,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Update match with game_id
      const { error: updateError } = await supabase
        .from("tournament_matches")
        .update({ 
          game_id: gameData.id,
          status: "ongoing"
        })
        .eq("id", match.id);

      if (updateError) throw updateError;

      navigate(`/online-game/${gameData.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to start match",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading tournament lobby...</p>
      </div>
    );
  }

  const myMatches = matches.filter(m => m.player1_id === userId || m.player2_id === userId);
  const currentRound = Math.max(...matches.map(m => m.round_number), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => navigate(`/tournament/${slug}`)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournament
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{tournament?.name}</h1>
          <div className="flex items-center gap-4">
            <Badge variant={tournament?.status === "ongoing" ? "default" : "secondary"}>
              {tournament?.status}
            </Badge>
            <span className="text-muted-foreground">Round {currentRound}</span>
          </div>
        </div>

        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList>
            <TabsTrigger value="matches">
              <Play className="mr-2 h-4 w-4" />
              My Matches
            </TabsTrigger>
            <TabsTrigger value="all-matches">
              <Users className="mr-2 h-4 w-4" />
              All Matches
            </TabsTrigger>
            <TabsTrigger value="standings">
              <Trophy className="mr-2 h-4 w-4" />
              Standings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Your Matches</CardTitle>
                <CardDescription>View and play your tournament matches</CardDescription>
              </CardHeader>
              <CardContent>
                {myMatches.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No matches scheduled yet. Check back soon!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {myMatches.map((match) => (
                      <Card key={match.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Round {match.round_number}</p>
                              <p className="font-medium">
                                {match.player1_username} vs {match.player2_username}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {match.status}
                              </Badge>
                            </div>
                            <Button
                              onClick={() => startMatch(match)}
                              disabled={match.status === "completed"}
                            >
                              {match.game_id ? "Continue Match" : "Start Match"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-matches">
            <Card>
              <CardHeader>
                <CardTitle>All Matches</CardTitle>
                <CardDescription>View all tournament matches</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round</TableHead>
                      <TableHead>Player 1</TableHead>
                      <TableHead>Player 2</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>{match.round_number}</TableCell>
                        <TableCell className={match.winner_id === match.player1_id ? "font-bold" : ""}>
                          {match.player1_username}
                        </TableCell>
                        <TableCell className={match.winner_id === match.player2_id ? "font-bold" : ""}>
                          {match.player2_username}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{match.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Standings</CardTitle>
                <CardDescription>Current tournament rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Wins</TableHead>
                      <TableHead>Losses</TableHead>
                      <TableHead>Draws</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((standing, index) => (
                      <TableRow key={standing.id} className={standing.id === userId ? "bg-accent" : ""}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{standing.username}</TableCell>
                        <TableCell>{standing.wins}</TableCell>
                        <TableCell>{standing.losses}</TableCell>
                        <TableCell>{standing.draws}</TableCell>
                        <TableCell className="font-bold">{standing.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
