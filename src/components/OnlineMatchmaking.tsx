import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface OnlineMatchmakingProps {
  userId: string;
  username: string;
  currentAvatar?: string;
}

export const OnlineMatchmaking = ({ userId, username, currentAvatar }: OnlineMatchmakingProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let matchCheckInterval: NodeJS.Timeout;

    if (isSearching) {
      // Timer for elapsed time
      timer = setInterval(() => {
        setTimeElapsed((prev) => {
          if (prev >= 60) {
            handleTimeout();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Check for matches every 2 seconds
      matchCheckInterval = setInterval(async () => {
        await checkForMatch();
      }, 2000);
    }

    return () => {
      clearInterval(timer);
      clearInterval(matchCheckInterval);
    };
  }, [isSearching]);

  const handleTimeout = async () => {
    setIsSearching(false);
    await leaveQueue();
    toast.error("No player found. Try again later.");
  };

  const joinQueue = async () => {
    try {
      // Clean up any existing entries first
      await supabase
        .from("match_queue")
        .delete()
        .eq("user_id", userId);

      // Join the queue
      const { error } = await supabase
        .from("match_queue")
        .insert({
          user_id: userId,
          username: username,
          current_avatar: currentAvatar,
        });

      if (error) throw error;

      setIsSearching(true);
      setTimeElapsed(0);
      toast.success("Searching for opponent...");
    } catch (error) {
      console.error("Error joining queue:", error);
      toast.error("Failed to join matchmaking queue");
    }
  };

  const leaveQueue = async () => {
    try {
      await supabase
        .from("match_queue")
        .delete()
        .eq("user_id", userId);

      setIsSearching(false);
      setTimeElapsed(0);
    } catch (error) {
      console.error("Error leaving queue:", error);
    }
  };

  const checkForMatch = async () => {
    try {
      // Get all players in queue except current user
      const { data: opponents, error } = await supabase
        .from("match_queue")
        .select("*")
        .neq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) throw error;

      if (opponents && opponents.length > 0) {
        const opponent = opponents[0];
        await createGame(opponent);
      }
    } catch (error) {
      console.error("Error checking for match:", error);
    }
  };

  const createGame = async (opponent: any) => {
    try {
      // Randomly assign colors
      const isWhite = Math.random() < 0.5;
      
      const gameData = {
        white_player_id: isWhite ? userId : opponent.user_id,
        black_player_id: isWhite ? opponent.user_id : userId,
        white_username: isWhite ? username : opponent.username,
        black_username: isWhite ? opponent.username : username,
        white_avatar: isWhite ? currentAvatar : opponent.current_avatar,
        black_avatar: isWhite ? opponent.current_avatar : currentAvatar,
      };

      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert(gameData)
        .select()
        .single();

      if (gameError) throw gameError;

      // Remove both players from queue
      await supabase
        .from("match_queue")
        .delete()
        .in("user_id", [userId, opponent.user_id]);

      // Navigate to game
      setIsSearching(false);
      toast.success("Match found!");
      navigate(`/online-game/${game.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <div className="flex flex-col items-center gap-4">
        <Users className="w-12 h-12 text-primary" />
        <h3 className="text-xl font-bold">Random 10 Min Match</h3>
        <p className="text-sm text-muted-foreground text-center">
          Get matched with a random player for a 10-minute chess game
        </p>

        {!isSearching ? (
          <Button onClick={joinQueue} className="w-full">
            Find Opponent
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Searching for opponent... {timeElapsed}s
            </p>
            <Button onClick={leaveQueue} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};