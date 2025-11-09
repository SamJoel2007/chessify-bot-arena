import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Loader2, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const JoinGame = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvite();
  }, [inviteCode]);

  const loadInvite = async () => {
    try {
      const { data, error } = await supabase
        .from("game_invites")
        .select("*")
        .eq("invite_code", inviteCode)
        .single();

      if (error || !data) {
        setError("Invalid invite code");
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("This invite has expired");
        setLoading(false);
        return;
      }

      // Check if already used
      if (data.status !== "pending") {
        setError("This invite has already been used");
        setLoading(false);
        return;
      }

      setInviteData(data);
      // Generate default guest name
      setDisplayName(`Guest_${Math.floor(Math.random() * 10000)}`);
      setLoading(false);
    } catch (err) {
      console.error("Error loading invite:", err);
      setError("Failed to load invite");
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    setJoining(true);

    try {
      // Create guest session
      const { data: guestData, error: guestError } = await supabase.functions.invoke(
        "create-guest-session",
        {
          body: { displayName: displayName.trim() },
        }
      );

      if (guestError || !guestData) {
        throw new Error("Failed to create guest session");
      }

      // Store guest session in localStorage
      localStorage.setItem("guest_session_token", guestData.sessionToken);
      localStorage.setItem("guest_player_id", guestData.guestPlayerId);
      localStorage.setItem("guest_display_name", guestData.displayName);

      // Join the game invite
      const { data: joinData, error: joinError } = await supabase.functions.invoke(
        "join-game-invite",
        {
          body: {
            inviteCode,
            guestPlayerId: guestData.guestPlayerId,
            sessionToken: guestData.sessionToken,
          },
        }
      );

      if (joinError || !joinData) {
        throw new Error("Failed to join game");
      }

      toast({
        title: "Joined successfully!",
        description: `Waiting for ${joinData.hostUsername} to start the game...`,
      });

      // Navigate to lobby
      navigate(`/lobby/${inviteCode}`);
    } catch (err: any) {
      console.error("Error joining game:", err);
      toast({
        title: "Failed to join",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="w-12 h-12 mx-auto text-primary mb-4" />
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Crown className="w-12 h-12 mx-auto text-primary mb-4" />
          <CardTitle>Join Chess Game</CardTitle>
          <CardDescription>
            You've been invited to play a game of chess
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Host Info */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={inviteData?.host_avatar || ""} />
              <AvatarFallback>{inviteData?.host_username?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{inviteData?.host_username}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{inviteData?.time_control / 60} min game</span>
              </div>
            </div>
          </div>

          {/* Guest Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              disabled={joining}
            />
            <p className="text-xs text-muted-foreground">
              This is a temporary session. Your game won't be saved to a profile.
            </p>
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoin}
            disabled={joining || !displayName.trim()}
            className="w-full"
            size="lg"
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Game"
            )}
          </Button>

          <div className="text-center">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGame;
