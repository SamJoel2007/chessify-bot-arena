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

// Define bot pools by skill level
const botPools = {
  beginner: [
    { name: "Emma", avatar: "👤", rating: 400 },
    { name: "Noah", avatar: "🧑", rating: 500 },
    { name: "Olivia", avatar: "👩", rating: 600 },
    { name: "Liam", avatar: "👨", rating: 700 },
    { name: "Sophia", avatar: "👱", rating: 800 },
  ],
  intermediate: [
    { name: "Lucas", avatar: "👨‍🦰", rating: 1000 },
    { name: "Mia", avatar: "👩‍🦱", rating: 1200 },
    { name: "Ethan", avatar: "🧔", rating: 1400 },
    { name: "Isabella", avatar: "👩‍🦳", rating: 1500 },
    { name: "Mason", avatar: "👨‍🦲", rating: 1650 },
  ],
  advanced: [
    { name: "Charlotte", avatar: "👩‍💼", rating: 1800 },
    { name: "James", avatar: "👨‍💼", rating: 1900 },
    { name: "Amelia", avatar: "👩‍🔬", rating: 2000 },
    { name: "Benjamin", avatar: "👨‍🔬", rating: 2100 },
    { name: "Harper", avatar: "👩‍🎓", rating: 2250 },
  ],
  expert: [
    { name: "Michael", avatar: "👨‍🎓", rating: 2300 },
    { name: "Evelyn", avatar: "👩‍⚕️", rating: 2400 },
    { name: "Alexander", avatar: "👨‍⚕️", rating: 2500 },
    { name: "Abigail", avatar: "👩‍🏫", rating: 2600 },
    { name: "Daniel", avatar: "👨‍🏫", rating: 2750 },
  ],
  master: [
    { name: "Elizabeth", avatar: "👩‍⚖️", rating: 2800 },
    { name: "Matthew", avatar: "👨‍⚖️", rating: 2900 },
    { name: "Sofia", avatar: "👩‍💻", rating: 3000 },
    { name: "Jackson", avatar: "👨‍💻", rating: 3100 },
    { name: "Avery", avatar: "👩‍🎨", rating: 3250 },
  ],
  grandmaster: [
    { name: "Scarlett", avatar: "👩‍🚀", rating: 3300 },
    { name: "Sebastian", avatar: "👨‍🚀", rating: 3400 },
    { name: "Victoria", avatar: "👸", rating: 3500 },
    { name: "William", avatar: "🤴", rating: 3600 },
    { name: "Aria", avatar: "👑", rating: 3750 },
  ],
};

export const OnlineMatchmaking = ({ userId, username, currentAvatar }: OnlineMatchmakingProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeControl, setTimeControl] = useState<number>(600);
  const [userPoints, setUserPoints] = useState<number>(0);
  const navigate = useNavigate();

  // Fetch user points on mount
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

  // Select bot based on user's skill level (points)
  const selectBotBySkill = (points: number) => {
    let pool;
    if (points < 500) pool = botPools.beginner;
    else if (points < 1000) pool = botPools.intermediate;
    else if (points < 1500) pool = botPools.advanced;
    else if (points < 2000) pool = botPools.expert;
    else if (points < 2500) pool = botPools.master;
    else pool = botPools.grandmaster;

    return pool[Math.floor(Math.random() * pool.length)];
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