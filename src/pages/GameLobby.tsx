import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Loader2, Copy, Check, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GameLobby = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [guestData, setGuestData] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadLobby();
    const channel = setupRealtimeSubscription();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [inviteCode]);

  const loadLobby = async () => {
    try {
      const { data: invite, error } = await supabase
        .from("game_invites")
        .select("*")
        .eq("invite_code", inviteCode)
        .single();

      if (error || !invite) {
        toast({
          title: "Invalid invite",
          description: "This invite link is not valid",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // If game already started, navigate directly
      if (invite.status === "started" && invite.game_id) {
        navigate(`/online-game/${invite.game_id}`);
        return;
      }

      setInviteData(invite);

      // Check if current user is host
      const { data: { user } } = await supabase.auth.getUser();
      const userIsHost = user && user.id === invite.host_user_id;
      if (userIsHost) {
        setIsHost(true);
      }

      // If guest already joined, auto-start the game (for host)
      if (invite.status === "joined" && invite.guest_player_id) {
        const { data: guest } = await supabase
          .from("guest_players")
          .select("*")
          .eq("id", invite.guest_player_id)
          .single();
        
        if (guest) {
          setGuestData(guest);
          if (userIsHost) {
            // Auto-start immediately
            setLoading(false);
            autoStartGame(invite, guest);
            return;
          }
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading lobby:", err);
      navigate("/");
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`lobby-${inviteCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_invites",
          filter: `invite_code=eq.${inviteCode}`,
        },
        async (payload) => {
          console.log("Invite updated:", payload);
          const updatedInvite = payload.new;
          setInviteData(updatedInvite);

          // If game started, navigate
          if (updatedInvite.status === "started" && updatedInvite.game_id) {
            toast({
              title: "Game starting!",
              description: "Let's play chess!",
            });
            navigate(`/online-game/${updatedInvite.game_id}`);
          }

          // If guest joined, auto-start the game (for host)
          if (updatedInvite.status === "joined" && updatedInvite.guest_player_id) {
            const { data: guest } = await supabase
              .from("guest_players")
              .select("*")
              .eq("id", updatedInvite.guest_player_id)
              .single();
            
            if (guest) {
              // Check if current user is host and auto-start
              const { data: { user } } = await supabase.auth.getUser();
              if (user && user.id === updatedInvite.host_user_id) {
                autoStartGame(updatedInvite, guest);
              }
            }
          }
        }
      )
      .subscribe();

    return channel;
  };

  const autoStartGame = async (invite: any, guest: any) => {
    setStarting(true);
    try {
      const isHostWhite = Math.random() < 0.5;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("username, current_avatar")
        .eq("id", user!.id)
        .single();

      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          white_player_id: isHostWhite ? user!.id : guest.id,
          black_player_id: isHostWhite ? guest.id : user!.id,
          white_player_type: isHostWhite ? "user" : "guest",
          black_player_type: isHostWhite ? "guest" : "user",
          white_username: isHostWhite ? hostProfile?.username : guest.display_name,
          black_username: isHostWhite ? guest.display_name : hostProfile?.username,
          white_avatar: isHostWhite ? hostProfile?.current_avatar : null,
          black_avatar: isHostWhite ? null : hostProfile?.current_avatar,
          invite_code: inviteCode,
          white_time_remaining: invite.time_control,
          black_time_remaining: invite.time_control,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      await supabase
        .from("game_invites")
        .update({ status: "started", game_id: game.id })
        .eq("id", invite.id);

      navigate(`/online-game/${game.id}`);
    } catch (err) {
      console.error("Error auto-starting game:", err);
      setStarting(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link with your friend",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (!guestData) {
      toast({
        title: "No opponent",
        description: "Waiting for guest to join",
        variant: "destructive",
      });
      return;
    }

    setStarting(true);

    try {
      // Randomly assign colors
      const isHostWhite = Math.random() < 0.5;

      // Get host profile
      const { data: { user } } = await supabase.auth.getUser();
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("username, current_avatar")
        .eq("id", user!.id)
        .single();

      // Create game
      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          white_player_id: isHostWhite ? user!.id : guestData.id,
          black_player_id: isHostWhite ? guestData.id : user!.id,
          white_player_type: isHostWhite ? "user" : "guest",
          black_player_type: isHostWhite ? "guest" : "user",
          white_username: isHostWhite ? hostProfile?.username : guestData.display_name,
          black_username: isHostWhite ? guestData.display_name : hostProfile?.username,
          white_avatar: isHostWhite ? hostProfile?.current_avatar : null,
          black_avatar: isHostWhite ? null : hostProfile?.current_avatar,
          invite_code: inviteCode,
          white_time_remaining: inviteData.time_control,
          black_time_remaining: inviteData.time_control,
        })
        .select()
        .single();

      if (gameError) {
        throw gameError;
      }

      // Update invite
      await supabase
        .from("game_invites")
        .update({
          status: "started",
          game_id: game.id,
        })
        .eq("id", inviteData.id);

      navigate(`/online-game/${game.id}`);
    } catch (err) {
      console.error("Error starting game:", err);
      toast({
        title: "Failed to start game",
        description: "Something went wrong",
        variant: "destructive",
      });
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Crown className="w-12 h-12 mx-auto text-primary mb-4" />
          <CardTitle>Game Lobby</CardTitle>
          <CardDescription>
            {isHost ? "Share the link and wait for your opponent" : "Waiting for host to start..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Players */}
          <div className="space-y-3">
            {/* Host */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={inviteData?.host_avatar || ""} />
                <AvatarFallback>{inviteData?.host_username?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{inviteData?.host_username}</p>
                <p className="text-xs text-muted-foreground">Host</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>

            {/* Guest */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {guestData ? (
                <>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>👤</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{guestData.display_name}</p>
                    <p className="text-xs text-muted-foreground">Guest</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground">Waiting for opponent...</p>
                    <p className="text-xs text-muted-foreground">Share the invite link</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Invite Link (for host) */}
          {isHost && !guestData && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Invite Link</label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/join/${inviteCode}`}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyInviteLink}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Auto-starting message */}
          {starting ? (
            <div className="text-center p-4 bg-muted rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Starting game...</p>
            </div>
          ) : !isHost ? (
            <div className="text-center p-4 bg-muted rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">
                Game will start automatically...
              </p>
            </div>
          ) : null}

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

export default GameLobby;
