import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender?: {
    username: string;
    email: string;
    current_avatar: string | null;
  };
  receiver?: {
    username: string;
    email: string;
    current_avatar: string | null;
  };
}

export default function Friends() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendRequest[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      loadFriendRequests(session.user.id);
    });

    const channel = supabase
      .channel('friend-requests-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
        },
        () => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) loadFriendRequests(session.user.id);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const loadFriendRequests = async (userId: string) => {
    try {
      // Load sent requests
      const { data: sent, error: sentError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          receiver:profiles!friend_requests_receiver_id_fkey(username, email, current_avatar)
        `)
        .eq('sender_id', userId);

      if (sentError) throw sentError;

      // Load received requests
      const { data: received, error: receivedError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:profiles!friend_requests_sender_id_fkey(username, email, current_avatar)
        `)
        .eq('receiver_id', userId);

      if (receivedError) throw receivedError;

      setSentRequests((sent || []).filter(r => r.status === 'pending'));
      setReceivedRequests((received || []).filter(r => r.status === 'pending'));
      setFriends([
        ...(sent || []).filter(r => r.status === 'accepted'),
        ...(received || []).filter(r => r.status === 'accepted')
      ]);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const sendFriendRequest = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      // Find user by username
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .single();

      if (userError || !targetUser) {
        toast.error('User not found');
        return;
      }

      if (targetUser.id === user.id) {
        toast.error("You can't send a friend request to yourself");
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: targetUser.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Friend request already sent');
        } else {
          throw error;
        }
        return;
      }

      // Create notification
      await supabase.from('notifications').insert({
        user_id: targetUser.id,
        type: 'friend_request',
        content: `You have a new friend request`,
        related_id: user.id,
      });

      toast.success('Friend request sent!');
      setUsername('');
      loadFriendRequests(user.id);
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const handleFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(accept ? 'Friend request accepted!' : 'Friend request rejected');
      loadFriendRequests(user.id);
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast.error('Failed to process request');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Friend</h2>
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              onKeyPress={(e) => e.key === 'Enter' && sendFriendRequest()}
            />
            <Button onClick={sendFriendRequest}>
              <UserPlus className="w-4 h-4 mr-2" />
              Send Request
            </Button>
          </div>
        </Card>

        <Tabs defaultValue="friends">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="received">Requests ({receivedRequests.length})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No friends yet
              </Card>
            ) : (
              friends.map((friend) => {
                const profile = friend.sender_id === user.id ? friend.receiver : friend.sender;
                return (
                  <Card key={friend.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-primary text-2xl">
                          {getAvatarIcon(profile?.current_avatar || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{profile?.username || profile?.email?.split('@')[0]}</p>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      </div>
                      <Button variant="outline" onClick={() => navigate('/messages')}>
                        Message
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {receivedRequests.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No pending requests
              </Card>
            ) : (
              receivedRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-primary text-2xl">
                        {getAvatarIcon(request.sender?.current_avatar || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{request.sender?.username || request.sender?.email?.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{request.sender?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" onClick={() => handleFriendRequest(request.id, true)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleFriendRequest(request.id, false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No sent requests
              </Card>
            ) : (
              sentRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-primary text-2xl">
                        {getAvatarIcon(request.receiver?.current_avatar || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{request.receiver?.username || request.receiver?.email?.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{request.receiver?.email}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">Pending</span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
