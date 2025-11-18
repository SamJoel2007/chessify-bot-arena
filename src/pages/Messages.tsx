import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { getAvatarIcon } from "@/lib/avatarUtils";

interface Friend {
  id: string;
  username: string;
  email: string;
  current_avatar: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export default function Messages() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      // Redirect anonymous users to auth to convert account
      if (session.user.is_anonymous) {
        toast.error("Please sign up to access messaging");
        navigate('/auth');
        return;
      }
      setUser(session.user);
      loadFriends(session.user.id);
    });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('direct-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && selectedFriend) {
            const newMsg = payload.new as Message;
            if (newMsg.sender_id === selectedFriend.id) {
              setMessages(prev => [...prev, newMsg]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedFriend]);

  const loadFriends = async (userId: string) => {
    try {
      const { data: friendRequests, error } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) throw error;

      const friendIds = friendRequests.map(fr => 
        fr.sender_id === userId ? fr.receiver_id : fr.sender_id
      );

      if (friendIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email, current_avatar')
          .in('id', friendIds);

        if (profileError) throw profileError;
        setFriends(profiles || []);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (friendId: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', friendId)
        .eq('read', false);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedFriend.id,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender_id: user.id,
        receiver_id: selectedFriend.id,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false,
      }]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Friends List */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Friends</h2>
            <ScrollArea className="h-full">
              {friends.length === 0 ? (
                <p className="text-muted-foreground text-sm">No friends yet</p>
              ) : (
                friends.map(friend => (
                  <div
                    key={friend.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedFriend?.id === friend.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      setSelectedFriend(friend);
                      loadMessages(friend.id);
                    }}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-gradient-primary text-2xl">
                        {getAvatarIcon(friend.current_avatar)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{friend.username || friend.email?.split('@')[0]}</p>
                      <p className="text-xs text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Messages */}
          <Card className="md:col-span-2 p-4 flex flex-col">
            {selectedFriend ? (
              <>
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-primary text-2xl">
                      {getAvatarIcon(selectedFriend.current_avatar)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedFriend.username || selectedFriend.email?.split('@')[0]}</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 py-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_id === user.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                <div className="flex gap-2 pt-4 border-t">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a friend to start messaging
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
