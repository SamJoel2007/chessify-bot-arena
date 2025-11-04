import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

interface GameChatProps {
  gameId: string;
  userId: string;
  username: string;
}

export const GameChat = ({ gameId, userId, username }: GameChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();
  }, [gameId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("game_chat")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`game-chat:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_chat",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from("game_chat").insert({
        game_id: gameId,
        user_id: userId,
        username: username,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="p-4 bg-gradient-card flex flex-col h-[400px]">
      <h3 className="font-bold mb-3">Game Chat</h3>
      <ScrollArea className="flex-1 mb-3 pr-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${
                msg.user_id === userId ? "items-end" : "items-start"
              }`}
            >
              <span className="text-xs text-muted-foreground font-medium">
                {msg.username}
              </span>
              <div
                className={`px-3 py-2 rounded-lg max-w-[80%] ${
                  msg.user_id === userId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button onClick={sendMessage} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
