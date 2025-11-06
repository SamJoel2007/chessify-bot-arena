import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Swords } from "lucide-react";
import { toast } from "sonner";

interface Friend {
  id: string;
  username: string;
  avatar: string | null;
}

interface FriendChallengeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  currentAvatar: string | null;
}

export default function FriendChallengeDialog({
  isOpen,
  onClose,
  userId,
  username,
  currentAvatar,
}: FriendChallengeDialogProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen, userId]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const { data: friendRequests, error } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) throw error;

      const friendIds = friendRequests?.map(fr => 
        fr.sender_id === userId ? fr.receiver_id : fr.sender_id
      ) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, current_avatar')
        .in('id', friendIds);

      if (profileError) throw profileError;

      setFriends(profiles?.map(p => ({
        id: p.id,
        username: p.username || 'Unknown',
        avatar: p.current_avatar
      })) || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const sendChallenge = async (friend: Friend) => {
    try {
      setSendingTo(friend.id);

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('game_challenges')
        .insert({
          challenger_id: userId,
          challenged_id: friend.id,
          challenger_username: username,
          challenged_username: friend.username,
          challenger_avatar: currentAvatar,
          challenged_avatar: friend.avatar,
          status: 'pending'
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: friend.id,
          type: 'game_challenge',
          content: `${username} challenged you to a game!`,
          related_id: challenge.id
        });

      if (notifError) throw notifError;

      toast.success(`Challenge sent to ${friend.username}!`);
      onClose();
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.error('Failed to send challenge');
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5" />
            Challenge a Friend
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No friends to challenge yet.</p>
            <p className="text-sm mt-2">Add friends to start challenging them!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friend.avatar || ''} />
                    <AvatarFallback>{friend.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{friend.username}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => sendChallenge(friend)}
                  disabled={sendingTo !== null}
                >
                  {sendingTo === friend.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Swords className="w-4 h-4 mr-1" />
                      Challenge
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
