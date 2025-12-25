import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { UserPlus, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { getAvatarIcon } from "@/lib/avatarUtils";

interface RandomUser {
  id: string;
  username: string;
  current_avatar: string | null;
  isFriend?: boolean;
  requestSent?: boolean;
}

interface FindPeopleProps {
  userId: string | null;
}

export const FindPeople = ({ userId }: FindPeopleProps) => {
  const [randomUsers, setRandomUsers] = useState<RandomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (userId) {
      loadRandomUsers();
    }
  }, [userId, searchQuery]);

  const loadRandomUsers = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Use the public_profiles view which excludes email for privacy
      let query = supabase
        .from("public_profiles")
        .select("id, username, current_avatar")
        .neq("id", userId);

      // Add search filter if search query exists
      if (searchQuery.trim()) {
        query = query.ilike("username", `%${searchQuery.trim()}%`).limit(6);
      } else {
        // Fetch more users to randomize from
        query = query.limit(50);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      if (!users || users.length === 0) {
        setRandomUsers([]);
        setLoading(false);
        return;
      }

      // Shuffle and limit to 6 users when not searching
      const selectedUsers = searchQuery.trim() 
        ? users 
        : users.sort(() => Math.random() - 0.5).slice(0, 6);

      // Check existing friend requests and friendships
      const { data: friendRequests } = await supabase
        .from("friend_requests")
        .select("sender_id, receiver_id, status")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      const usersWithStatus = selectedUsers.map(user => {
        const request = friendRequests?.find(
          req => 
            (req.sender_id === userId && req.receiver_id === user.id) ||
            (req.receiver_id === userId && req.sender_id === user.id)
        );

        return {
          ...user,
          isFriend: request?.status === 'accepted',
          requestSent: request?.status === 'pending' && request?.sender_id === userId,
        };
      });

      setRandomUsers(usersWithStatus);
    } catch (error) {
      console.error('Error loading random users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string, targetUsername: string) => {
    if (!userId) {
      toast.error('Please sign in to send friend requests');
      return;
    }

    setSendingTo(targetUserId);
    try {
      // Get sender's username
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from("friend_requests")
        .insert({
          sender_id: userId,
          receiver_id: targetUserId,
          status: 'pending',
        });

      if (error) throw error;

      // Create notification for the receiver
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'friend_request',
        content: `${senderProfile?.username || 'Someone'} sent you a friend request`,
        related_id: userId,
      });

      toast.success(`Friend request sent to ${targetUsername}!`);
      
      // Refresh the user list to update button states
      loadRandomUsers();
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.code === '23505') {
        toast.error('Friend request already exists');
      } else {
        toast.error('Failed to send friend request');
      }
    } finally {
      setSendingTo(null);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold">Find People</h3>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-8 bg-muted rounded w-full" />
            </Card>
          ))}
        </div>
      ) : randomUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery.trim() 
              ? `No users found matching "${searchQuery}"`
              : "No users found at the moment."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {randomUsers.map((user) => (
            <Card key={user.id} className="p-4 flex flex-col items-center hover:border-primary/50 transition-all">
              <Avatar className="w-16 h-16 mb-3">
                <AvatarFallback className="bg-gradient-primary text-3xl">
                  {getAvatarIcon(user.current_avatar)}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold text-center mb-3 truncate w-full">
                {user.username || 'Anonymous'}
              </p>
              {user.isFriend ? (
                <Button size="sm" variant="outline" disabled className="w-full text-xs">
                  Friends
                </Button>
              ) : user.requestSent ? (
                <Button size="sm" variant="outline" disabled className="w-full text-xs">
                  Sent
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="default" 
                  className="w-full text-xs gap-1"
                  onClick={() => sendFriendRequest(user.id, user.username || 'Anonymous')}
                  disabled={sendingTo === user.id}
                >
                  <UserPlus className="w-3 h-3" />
                  Add
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
