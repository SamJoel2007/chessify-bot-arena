import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Send, UserPlus, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarIcon } from "@/lib/avatarUtils";

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
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const channelRef = useRef<any>(null);

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

    // Fetch user avatars
    const fetchUserAvatars = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, current_avatar");
      
      if (data) {
        const avatarMap: Record<string, string> = {};
        data.forEach(profile => {
          avatarMap[profile.id] = profile.current_avatar || "default";
        });
        setUserAvatars(avatarMap);
      }
    };

    fetchUserAvatars();

    // Fetch friend relationships
    const loadFriendRelationships = async () => {
      const { data: sent } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("sender_id", currentUser.id);
      
      const { data: received } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("receiver_id", currentUser.id);
      
      const allRequests = [...(sent || []), ...(received || [])];
      setFriendRequests(allRequests);
      setFriends(allRequests.filter(r => r.status === "accepted"));
    };

    loadFriendRelationships();

    // Set up presence tracking and message subscription
    const channel = supabase.channel("community-chat");

    // Track presence
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const userCount = Object.keys(state).length;
        setActiveUsers(userCount);
        console.log(`Active users: ${userCount}`);
      })
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
        },
        async () => {
          const { data: sent } = await supabase
            .from("friend_requests")
            .select("*")
            .eq("sender_id", currentUser.id);
          
          const { data: received } = await supabase
            .from("friend_requests")
            .select("*")
            .eq("receiver_id", currentUser.id);
          
          const allRequests = [...(sent || []), ...(received || [])];
          setFriendRequests(allRequests);
          setFriends(allRequests.filter(r => r.status === "accepted"));
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUser.id,
            email: currentUser.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUser]);

  const getRelationshipStatus = (userId: string) => {
    if (userId === currentUser?.id) return "self";
    
    const isFriend = friends.some(
      f => (f.sender_id === userId || f.receiver_id === userId)
    );
    if (isFriend) return "friend";
    
    const sentRequest = friendRequests.find(
      f => f.sender_id === currentUser?.id && f.receiver_id === userId && f.status === "pending"
    );
    if (sentRequest) return "sent";
    
    const receivedRequest = friendRequests.find(
      f => f.sender_id === userId && f.receiver_id === currentUser?.id && f.status === "pending"
    );
    if (receivedRequest) return "received";
    
    return "none";
  };

  const sendFriendRequest = async (targetUserId: string, targetUsername: string) => {
    if (targetUserId === currentUser?.id) {
      toast.error("You can't send a friend request to yourself");
      return;
    }

    try {
      const { error } = await supabase
        .from("friend_requests")
        .insert({
          sender_id: currentUser.id,
          receiver_id: targetUserId,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Friend request already sent");
        } else {
          throw error;
        }
        return;
      }

      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "friend_request",
        content: `You have a new friend request`,
        related_id: currentUser.id,
      });

      toast.success(`Friend request sent to ${targetUsername}!`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

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

    // Trigger bot response only if user is alone
    if (activeUsers === 1) {
      try {
        await supabase.functions.invoke('chat-bot-response', {
          body: { 
            message: messageText, 
            username: username,
            activeUserCount: activeUsers 
          }
        });
      } catch (error) {
        console.error("Error triggering bot response:", error);
      }
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
        <p className="text-muted-foreground">
          Connect with chess players worldwide • {activeUsers} {activeUsers === 1 ? 'user' : 'users'} online
          {activeUsers === 1 && ' (Bots will keep you company!)'}
        </p>
      </div>

      <Card className="bg-gradient-card border-border/50 overflow-hidden">
        <ScrollArea className="h-[500px] p-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.user_id === currentUser?.id;
                const userAvatar = userAvatars[msg.user_id] || "default";
                const timestamp = new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={msg.id} className="flex gap-3 group">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className={isCurrentUser ? "bg-accent" : "bg-primary"}>
                        <span className="text-2xl">{getAvatarIcon(userAvatar)}</span>
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors">
                              {isCurrentUser ? "You" : msg.username}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarFallback className={isCurrentUser ? "bg-accent" : "bg-primary"}>
                                    <span className="text-2xl">{getAvatarIcon(userAvatar)}</span>
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{msg.username}</p>
                                  <p className="text-xs text-muted-foreground">{timestamp}</p>
                                </div>
                              </div>
                              
                              {!isCurrentUser && (
                                <div className="flex gap-2">
                                  {(() => {
                                    const status = getRelationshipStatus(msg.user_id);
                                    switch (status) {
                                      case "friend":
                                        return (
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full"
                                            onClick={() => navigate("/messages")}
                                          >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Message
                                          </Button>
                                        );
                                      case "sent":
                                        return (
                                          <Button variant="outline" size="sm" className="w-full" disabled>
                                            <Check className="w-4 h-4 mr-2" />
                                            Request Sent
                                          </Button>
                                        );
                                      case "received":
                                        return (
                                          <Button 
                                            variant="default" 
                                            size="sm" 
                                            className="w-full"
                                            onClick={() => navigate("/friends")}
                                          >
                                            <Check className="w-4 h-4 mr-2" />
                                            Accept Request
                                          </Button>
                                        );
                                      default:
                                        return (
                                          <Button 
                                            variant="default" 
                                            size="sm" 
                                            className="w-full"
                                            onClick={() => sendFriendRequest(msg.user_id, msg.username)}
                                          >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Add Friend
                                          </Button>
                                        );
                                    }
                                  })()}
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
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
