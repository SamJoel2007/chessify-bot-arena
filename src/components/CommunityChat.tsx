import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: number;
  user: string;
  text: string;
  timestamp: string;
  avatar: string;
}

export const CommunityChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      user: "ChessMaster99",
      text: "Anyone up for a quick game?",
      timestamp: "2:30 PM",
      avatar: "bg-primary",
    },
    {
      id: 2,
      user: "KnightRider",
      text: "Just beat the Advanced bot! 🎉",
      timestamp: "2:32 PM",
      avatar: "bg-secondary",
    },
    {
      id: 3,
      user: "PawnStorm",
      text: "Looking for tips on the Sicilian Defense",
      timestamp: "2:35 PM",
      avatar: "bg-gold",
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      user: "You",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: "bg-accent",
    };

    setMessages([...messages, newMessage]);
    setMessage("");
    toast.success("Message sent!");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Community Chat</h2>
        <p className="text-muted-foreground">Connect with chess players worldwide</p>
      </div>

      <Card className="bg-gradient-card border-border/50 overflow-hidden">
        <ScrollArea className="h-[500px] p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 group">
                <div className={`w-10 h-10 rounded-full ${msg.avatar} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm">{msg.user}</span>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm bg-muted/30 rounded-lg p-3 break-words">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
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
