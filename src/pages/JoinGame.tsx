import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const JoinGame = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!hasJoined.current) {
      autoJoinGame();
    }
  }, [inviteCode]);

  const autoJoinGame = async () => {
    if (hasJoined.current) return;
    hasJoined.current = true;

    try {
      // First check if invite is valid
      const { data: invite, error: inviteError } = await supabase
        .from("game_invites")
        .select("*")
        .eq("invite_code", inviteCode)
        .single();

      if (inviteError || !invite) {
        setError("Invalid invite code");
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        setError("This invite has expired");
        setLoading(false);
        return;
      }

      // Check if already used
      if (invite.status !== "pending") {
        setError("This invite has already been used");
        setLoading(false);
        return;
      }

      // Auto-generate display name
      const displayName = `Guest_${Math.floor(Math.random() * 10000)}`;

      // Create guest session
      const { data: guestData, error: guestError } = await supabase.functions.invoke(
        "create-guest-session",
        {
          body: { displayName },
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
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Joining game...</p>
        </div>
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

  return null;
};

export default JoinGame;