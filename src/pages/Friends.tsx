import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  current_avatar: string | null;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

interface FriendWithProfile extends FriendRequest {
  profile?: Profile;
}

export default function Friends() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [sentRequests, setSentRequests] = useState<FriendWithProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendWithProfile[]>([]);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      // Redirect anonymous users to auth to convert account
      if (session.user.is_anonymous) {
        toast.error("Please sign up to access friends features");
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
        .select('*')
        .eq('sender_id', userId);

      if (sentError) throw sentError;

      // Load received requests
      const { data: received, error: receivedError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', userId);

      if (receivedError) throw receivedError;

      // Get all unique user IDs
      const allRequests = [...(sent || []), ...(received || [])];
      const userIds = new Set<string>();
      allRequests.forEach(req => {
        userIds.add(req.sender_id);
        userIds.add(req.receiver_id);
      });

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      const profileMap = new Map<string, Profile>();
      (profiles || []).forEach(p => profileMap.set(p.id, p));

      // Attach profiles to requests
      const sentWithProfiles = (sent || []).filter(r => r.status === 'pending').map(r => ({
        ...r,
        profile: profileMap.get(r.receiver_id)
      }));

      const receivedWithProfiles = (received || []).filter(r => r.status === 'pending').map(r => ({
        ...r,
        profile: profileMap.get(r.sender_id)
      }));

      const friendsWithProfiles = [
        ...(sent || []).filter(r => r.status === 'accepted').map(r => ({
          ...r,
          profile: profileMap.get(r.receiver_id)
        })),
        ...(received || []).filter(r => r.status === 'accepted').map(r => ({
          ...r,
          profile: profileMap.get(r.sender_id)
        }))
      ];

      setSentRequests(sentWithProfiles);
      setReceivedRequests(receivedWithProfiles);
      setFriends(friendsWithProfiles);
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
        .maybeSingle();

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
      <Helmet>
        <title>Chess Friends - Play with Friends Online | Chessify</title>
        <meta name="description" content="Connect with chess friends on Chessify. Add friends, send friend requests, play chess with friends online, and challenge your friends to exciting chess matches." />
        <meta name="keywords" content="chess friends, play chess with friends, add chess friends, chess friend requests, invite friends chess, play with friends online, chess social, chess multiplayer friends" />
        <link rel="canonical" href="https://chessify.lovable.app/friends" />
      </Helmet>
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
              friends.map((friend) => (
                <Card key={friend.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-primary text-2xl">
                        {getAvatarIcon(friend.profile?.current_avatar || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{friend.profile?.username || friend.profile?.email?.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{friend.profile?.email}</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/messages')}>
                      Message
                    </Button>
                  </div>
                </Card>
              ))
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
                        {getAvatarIcon(request.profile?.current_avatar || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{request.profile?.username || request.profile?.email?.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{request.profile?.email}</p>
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
                        {getAvatarIcon(request.profile?.current_avatar || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{request.profile?.username || request.profile?.email?.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{request.profile?.email}</p>
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
