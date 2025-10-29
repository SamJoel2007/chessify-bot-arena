import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
  user_id: string;
}

export const CommunityChat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setCurrentUser({
        id: session.user.id,
        email: session.user.email || "Anonymous",
      });
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

    // Load existing messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        toast.error("Failed to load messages");
        return;
      }

      setMessages(data || []);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const handleSend = async () => {
    if (!message.trim() || !currentUser) return;

    const messageText = message.trim();
    const username = currentUser.email.split("@")[0];

    const { error } = await supabase.from("chat_messages").insert({
      user_id: currentUser.id,
      username: username,
      message: messageText,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return;
    }

    setMessage("");

    // Trigger bot response
    try {
      await supabase.functions.invoke('chat-bot-response', {
        body: { message: messageText, username: username }
      });
    } catch (error) {
      console.error("Error triggering bot response:", error);
      // Don't show error to user, bots are optional
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Community Chat</h2>
          <p className="text-muted-foreground">Connect with chess players worldwide</p>
        </div>
        <Card className="bg-gradient-card border-border/50 p-6">
          <p className="text-center text-muted-foreground">Loading chat...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Community Chat</h2>
        <p className="text-muted-foreground">Connect with chess players worldwide</p>
      </div>

      <Card className="bg-gradient-card border-border/50 overflow-hidden">
        <ScrollArea className="h-[500px] p-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.user_id === currentUser?.id;
                const avatarColor = isCurrentUser ? "bg-accent" : "bg-primary";
                const timestamp = new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={msg.id} className="flex gap-3 group">
                    <div className={`w-10 h-10 rounded-full ${avatarColor} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {isCurrentUser ? "You" : msg.username}
                        </span>
                        <span className="text-xs text-muted-foreground">{timestamp}</span>
                      </div>
                      <p className="text-sm bg-muted/30 rounded-lg p-3 break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-card/50">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
