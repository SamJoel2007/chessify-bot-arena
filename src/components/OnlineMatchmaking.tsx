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
  const [userPoints, setUserPoints] = useState<number>(0);
  const navigate = useNavigate();

  // Fetch user profile to get points
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single();
      
      if (data) {
        setUserPoints(data.points);
      }
    };

    fetchUserProfile();
  }, [userId]);

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

  // Bot pools organized by skill level
  const selectBotBySkill = (points: number) => {
    const beginnerBots = [
      { name: "Emma", avatar: "👤" }, { name: "Noah", avatar: "🧑" },
      { name: "Olivia", avatar: "👩" }, { name: "Liam", avatar: "👨" },
      { name: "Ava", avatar: "👱‍♀️" }, { name: "Oliver", avatar: "👨‍🦰" },
      { name: "Sophia", avatar: "👩‍🦱" }, { name: "Elijah", avatar: "🧔" },
    ];

    const intermediateBots = [
      { name: "Charlotte", avatar: "👤" }, { name: "James", avatar: "🧑" },
      { name: "Amelia", avatar: "👩" }, { name: "Benjamin", avatar: "👨" },
      { name: "Isabella", avatar: "👱‍♀️" }, { name: "Lucas", avatar: "👨‍🦰" },
      { name: "Mia", avatar: "👩‍🦱" }, { name: "Henry", avatar: "🧔" },
    ];

    const advancedBots = [
      { name: "Harper", avatar: "👤" }, { name: "Alexander", avatar: "🧑" },
      { name: "Evelyn", avatar: "👩" }, { name: "Michael", avatar: "👨" },
      { name: "Abigail", avatar: "👱‍♀️" }, { name: "Daniel", avatar: "👨‍🦰" },
      { name: "Emily", avatar: "👩‍🦱" }, { name: "Matthew", avatar: "🧔" },
    ];

    const expertBots = [
      { name: "Elizabeth", avatar: "👤" }, { name: "Jackson", avatar: "🧑" },
      { name: "Sofia", avatar: "👩" }, { name: "Sebastian", avatar: "👨" },
      { name: "Avery", avatar: "👱‍♀️" }, { name: "David", avatar: "👨‍🦰" },
      { name: "Ella", avatar: "👩‍🦱" }, { name: "Joseph", avatar: "🧔" },
    ];

    const masterBots = [
      { name: "Scarlett", avatar: "👤" }, { name: "Carter", avatar: "🧑" },
      { name: "Victoria", avatar: "👩" }, { name: "Owen", avatar: "👨" },
      { name: "Aria", avatar: "👱‍♀️" }, { name: "Wyatt", avatar: "👨‍🦰" },
      { name: "Grace", avatar: "👩‍🦱" }, { name: "John", avatar: "🧔" },
    ];

    const grandmasterBots = [
      { name: "Chloe", avatar: "👤" }, { name: "Luke", avatar: "🧑" },
      { name: "Camila", avatar: "👩" }, { name: "Julian", avatar: "👨" },
      { name: "Penelope", avatar: "👱‍♀️" }, { name: "Grayson", avatar: "👨‍🦰" },
      { name: "Layla", avatar: "👩‍🦱" }, { name: "Jack", avatar: "🧔" },
    ];

    let botPool = beginnerBots;
    if (points >= 2500) botPool = grandmasterBots;
    else if (points >= 2000) botPool = masterBots;
    else if (points >= 1500) botPool = expertBots;
    else if (points >= 1000) botPool = advancedBots;
    else if (points >= 500) botPool = intermediateBots;

    return botPool[Math.floor(Math.random() * botPool.length)];
  };

  const handleBotMatch = async () => {
    try {
      setIsSearching(false);
      await leaveQueue();
      
      const selectedBot = selectBotBySkill(userPoints);
      const botUserId = crypto.randomUUID();
      const isPlayerWhite = Math.random() < 0.5;
      
      // Create game with bot
      const { data: newGame, error } = await supabase
        .from("games")
        .insert({
          white_player_id: isPlayerWhite ? userId : botUserId,
          black_player_id: isPlayerWhite ? botUserId : userId,
          white_username: isPlayerWhite ? username : selectedBot.name,
          black_username: isPlayerWhite ? selectedBot.name : username,
          white_avatar: isPlayerWhite ? currentAvatar : selectedBot.avatar,
          black_avatar: isPlayerWhite ? selectedBot.avatar : currentAvatar,
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
          Get matched with a random player or AI opponent based on your skill level
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
