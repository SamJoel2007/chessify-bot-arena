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
  const [timeControl, setTimeControl] = useState<number>(600);
  const navigate = useNavigate();

  // Subscribe to realtime game creation
  useEffect(() => {
    const channel = supabase
      .channel('game-matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'games',
        },
        async (payload) => {
          const newGame = payload.new as any;
          // Check if this user is part of the game
          if (newGame.white_player_id === userId || newGame.black_player_id === userId) {
            await leaveQueue();
            setIsSearching(false);
            toast.success("Match found!");
            navigate(`/online-game/${newGame.id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isSearching) {
      // Timer for elapsed time
      timer = setInterval(() => {
        setTimeElapsed((prev) => {
          if (prev >= 25) {
            handleBotMatch();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [isSearching]);

  const handleBotMatch = async () => {
    try {
      setIsSearching(false);
      await leaveQueue();
      
      // Create bot profiles that look realistic
      const botProfiles = [
        { name: "Alex", avatar: "👤" },
        { name: "Jordan", avatar: "🧑" },
        { name: "Sam", avatar: "👨" },
        { name: "Taylor", avatar: "👩" },
        { name: "Morgan", avatar: "🧔" },
        { name: "Casey", avatar: "👱" },
        { name: "Riley", avatar: "👨‍🦰" },
        { name: "Quinn", avatar: "👩‍🦱" },
      ];
      
      const randomBot = botProfiles[Math.floor(Math.random() * botProfiles.length)];
      const botUserId = crypto.randomUUID();
      const isPlayerWhite = Math.random() < 0.5;
      
      // Create game with bot
      const { data: newGame, error } = await supabase
        .from("games")
        .insert({
          white_player_id: isPlayerWhite ? userId : botUserId,
          black_player_id: isPlayerWhite ? botUserId : userId,
          white_username: isPlayerWhite ? username : randomBot.name,
          black_username: isPlayerWhite ? randomBot.name : username,
          white_avatar: isPlayerWhite ? currentAvatar : randomBot.avatar,
          black_avatar: isPlayerWhite ? randomBot.avatar : currentAvatar,
          white_time_remaining: timeControl,
          black_time_remaining: timeControl,
          status: "active",
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Match found!");
      navigate(`/online-game/${newGame.id}`);
    } catch (error) {
      console.error("Error creating bot match:", error);
      toast.error("Failed to create match");
    }
  };

  const joinQueue = async (selectedTimeControl: number) => {
    try {
      setIsSearching(true);
      setTimeElapsed(0);
      setTimeControl(selectedTimeControl);
      const gameMode = selectedTimeControl === 60 ? "1-min" : "10-min";
      toast.success(`Searching for ${gameMode} opponent...`);

      // Call the server-side matchmaking function
      const { data, error } = await supabase.functions.invoke('matchmaking', {
        body: {
          username,
          currentAvatar,
          timeControl: selectedTimeControl,
        },
      });

      if (error) throw error;

      console.log("Matchmaking result:", data);

      // Check the result
      if (data.status === 'matched') {
        // Match found immediately
        await leaveQueue();
        setIsSearching(false);
        toast.success("Match found!");
        navigate(`/online-game/${data.game_id}`);
      } else if (data.status === 'waiting') {
        // Added to queue, wait for realtime notification
        console.log("Added to matchmaking queue, waiting for opponent...");
      }
    } catch (error) {
      console.error("Error in matchmaking:", error);
      toast.error("Failed to join matchmaking");
      setIsSearching(false);
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

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <div className="flex flex-col items-center gap-4">
        <Users className="w-12 h-12 text-primary" />
        <h3 className="text-xl font-bold">Random Online Match</h3>
        <p className="text-sm text-muted-foreground text-center">
          Get matched with a random player for a timed chess game
        </p>

        {!isSearching ? (
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={() => joinQueue(600)} className="w-full">
              Find Opponent (10 min)
            </Button>
            <Button onClick={() => joinQueue(60)} variant="secondary" className="w-full">
              Bullet (1 min)
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Searching for {timeControl === 60 ? "1-min" : "10-min"} opponent... {timeElapsed}s
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