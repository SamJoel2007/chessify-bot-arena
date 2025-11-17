import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, UserPlus, Check, MessageCircle, Paperclip, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { z } from "zod";

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
  user_id: string;
  image_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  link_image?: string;
}

// Message validation schema (max 2000 characters to match DB constraint)
const messageSchema = z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long (max 2000 characters)");

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const channelRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (jpg, png, gif, webp)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUser?.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("chat-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-images")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const detectLinks = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedImage) || !currentUser) return;

    const messageText = message.trim();
    
    // Validate message with Zod schema if text is present
    if (messageText) {
      const validation = messageSchema.safeParse(messageText);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    }
    
    const username = currentUser.email.split("@")[0];

    setIsUploadingImage(true);

    try {
      let imageUrl: string | null = null;
      
      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          setIsUploadingImage(false);
          return;
        }
      }

      // Detect links in message
      const linkUrl = messageText ? detectLinks(messageText) : null;

      const { error } = await supabase.from("chat_messages").insert({
        user_id: currentUser.id,
        username: username,
        message: messageText || "(image)",
        image_url: imageUrl,
        link_url: linkUrl,
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        setIsUploadingImage(false);
        return;
      }

      setMessage("");
      removeImage();
      setIsUploadingImage(false);

      // Trigger bot response only if user is alone
      if (activeUsers === 1) {
        try {
          await supabase.functions.invoke('chat-bot-response', {
            body: { 
              message: messageText || "(sent an image)", 
              username: username,
              activeUserCount: activeUsers 
            }
          });
        } catch (error) {
          console.error("Error triggering bot response:", error);
        }
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
      toast.error("Failed to send message");
      setIsUploadingImage(false);
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

                const status = getRelationshipStatus(msg.user_id);
                
                return (
                  <div key={msg.id} className="flex gap-3 group">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className={isCurrentUser ? "bg-accent" : "bg-primary"}>
                        <span className="text-2xl">{getAvatarIcon(userAvatar)}</span>
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm">
                          {isCurrentUser ? "You" : msg.username}
                        </span>
                        <span className="text-xs text-muted-foreground">{timestamp}</span>
                        
                        {!isCurrentUser && (
                          <>
                            {status === "friend" && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={() => navigate("/messages")}
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Message
                              </Button>
                            )}
                            {status === "sent" && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                disabled
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Sent
                              </Button>
                            )}
                            {status === "received" && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={() => navigate("/friends")}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Accept
                              </Button>
                            )}
                            {status === "none" && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={() => sendFriendRequest(msg.user_id, msg.username)}
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Add Friend
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                      <div className="text-sm space-y-2">
                        {msg.message && (
                          <p className="bg-muted/30 rounded-lg p-3 break-words">
                            {msg.message}
                          </p>
                        )}
                        
                        {msg.image_url && (
                          <div className="relative rounded-lg overflow-hidden max-w-sm">
                            <img 
                              src={msg.image_url} 
                              alt="Shared image" 
                              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          </div>
                        )}
                        
                        {msg.link_url && (
                          <a 
                            href={msg.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition-colors border border-border"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-primary font-medium truncate">
                                  {msg.link_url}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Click to open link
                                </p>
                              </div>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-card/50">
          {imagePreviewUrl && (
            <div className="mb-3 relative inline-block">
              <img 
                src={imagePreviewUrl} 
                alt="Preview" 
                className="h-20 w-20 object-cover rounded-lg border border-border"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={removeImage}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="icon"
              variant="outline"
              disabled={isUploadingImage}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1"
              disabled={isUploadingImage}
            />
            <Button 
              onClick={handleSend} 
              size="icon"
              disabled={isUploadingImage || (!message.trim() && !selectedImage)}
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
