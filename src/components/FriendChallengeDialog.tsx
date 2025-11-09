import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Swords, Link, Copy, Check } from "lucide-react";
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
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 9) + 
           Math.random().toString(36).substring(2, 9);
  };

  const generateInviteLink = async () => {
    setGeneratingInvite(true);
    try {
      const code = generateInviteCode();
      
      const { error } = await supabase
        .from('game_invites')
        .insert({
          invite_code: code,
          host_user_id: userId,
          host_username: username,
          host_avatar: currentAvatar,
          status: 'pending',
          time_control: 600,
        });

      if (error) throw error;

      setInviteCode(code);
      toast.success('Invite link generated!');
      
      // Navigate to lobby
      setTimeout(() => {
        navigate(`/lobby/${code}`);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error generating invite:', error);
      toast.error('Failed to generate invite link');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
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

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">Friend List</TabsTrigger>
            <TabsTrigger value="invite">Invite Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="mt-4">
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
          </TabsContent>

          <TabsContent value="invite" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Generate a link to invite anyone to play, even if they don't have an account!</p>
                <p className="mt-2 text-xs">The link expires in 24 hours.</p>
              </div>

              {!inviteCode ? (
                <Button
                  onClick={generateInviteLink}
                  disabled={generatingInvite}
                  className="w-full"
                >
                  {generatingInvite ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Generate Invite Link
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/join/${inviteCode}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyInviteLink}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Navigating to lobby...
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
