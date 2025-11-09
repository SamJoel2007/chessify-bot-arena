import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, Trophy, ArrowLeft, LogIn } from "lucide-react";
import { format } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  max_participants: number | null;
  status: string;
  registration_slug: string;
}

interface Participant {
  id: string;
  username: string;
  registered_at: string;
}

export default function TournamentRegistration() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchTournament();
  }, [slug]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setUsername(profile?.username || "Player");
    }
  };

  const fetchTournament = async () => {
    try {
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("registration_slug", slug)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      const { data: participantsData, error: participantsError } = await supabase
        .from("tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentData.id)
        .order("registered_at", { ascending: true });

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      if (userId) {
        const registered = participantsData?.some(p => p.user_id === userId);
        setIsRegistered(!!registered);
      }
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

  const handleRegister = async () => {
    if (!userId || !username) {
      toast({
        title: "Please sign in",
        description: "You must be signed in to register for tournaments",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!tournament) return;

    if (tournament.max_participants && participants.length >= tournament.max_participants) {
      toast({
        title: "Tournament Full",
        description: "This tournament has reached its maximum participants",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("tournament_participants")
        .insert({
          tournament_id: tournament.id,
          user_id: userId,
          username: username,
        });

      if (error) throw error;

      // Also create standings entry
      await supabase
        .from("tournament_standings")
        .insert({
          tournament_id: tournament.id,
          user_id: userId,
          username: username,
        });

      toast({ title: "Successfully registered for tournament!" });
      setIsRegistered(true);
      fetchTournament();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading tournament...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Tournament Not Found</CardTitle>
            <CardDescription>This tournament does not exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFull = tournament.max_participants && participants.length >= tournament.max_participants;
  const canRegister = tournament.status === "upcoming" && !isRegistered && !isFull;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{tournament.name}</CardTitle>
                    <CardDescription className="text-base">
                      {tournament.description || "Join this exciting chess tournament!"}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    tournament.status === "upcoming" ? "default" :
                    tournament.status === "ongoing" ? "secondary" :
                    "outline"
                  }>
                    {tournament.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Start Date</p>
                      <p className="text-sm">{format(new Date(tournament.start_date), "PPP")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Participants</p>
                      <p className="text-sm">
                        {participants.length}
                        {tournament.max_participants && ` / ${tournament.max_participants}`}
                      </p>
                    </div>
                  </div>
                </div>

                {canRegister && (
                  <Button onClick={handleRegister} size="lg" className="w-full">
                    <Trophy className="mr-2 h-5 w-5" />
                    Register for Tournament
                  </Button>
                )}

                {isRegistered && (
                  <div className="space-y-3">
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      ✓ You are registered
                    </Badge>
                    <Button 
                      onClick={() => navigate(`/tournament/${slug}/lobby`)} 
                      variant="outline"
                      className="w-full"
                    >
                      Enter Tournament Lobby
                    </Button>
                  </div>
                )}

                {isFull && !isRegistered && (
                  <Badge variant="destructive" className="w-full justify-center py-2">
                    Tournament Full
                  </Badge>
                )}

                {!userId && (
                  <Button onClick={() => navigate("/auth")} variant="outline" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In to Register
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Registered Participants</CardTitle>
                <CardDescription>{participants.length} registered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{participant.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{participant.username}</p>
                        <p className="text-xs text-muted-foreground">
                          #{index + 1} · Joined {format(new Date(participant.registered_at), "MMM dd")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No participants yet. Be the first!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
