import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ChallengeNotificationProps {
  challengeId: string;
  challengerName: string;
  onUpdate: () => void;
}

export default function ChallengeNotification({
  challengeId,
  challengerName,
  onUpdate,
}: ChallengeNotificationProps) {
  const navigate = useNavigate();
  const [responding, setResponding] = useState(false);

  const handleAccept = async () => {
    try {
      setResponding(true);

      // Get challenge details
      const { data: challenge, error: fetchError } = await supabase
        .from('game_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (fetchError) throw fetchError;

      // Create game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          white_player_id: Math.random() < 0.5 ? challenge.challenger_id : challenge.challenged_id,
          black_player_id: Math.random() < 0.5 ? challenge.challenger_id : challenge.challenged_id,
          white_username: Math.random() < 0.5 ? challenge.challenger_username : challenge.challenged_username,
          black_username: Math.random() < 0.5 ? challenge.challenger_username : challenge.challenged_username,
          white_avatar: Math.random() < 0.5 ? challenge.challenger_avatar : challenge.challenged_avatar,
          black_avatar: Math.random() < 0.5 ? challenge.challenger_avatar : challenge.challenged_avatar,
          status: 'active'
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Update challenge
      const { error: updateError } = await supabase
        .from('game_challenges')
        .update({ 
          status: 'accepted',
          game_id: game.id
        })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // Notify challenger
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: challenge.challenger_id,
          type: 'challenge_accepted',
          content: `${challenge.challenged_username} accepted your challenge!`,
          related_id: game.id
        });

      if (notifError) throw notifError;

      toast.success('Challenge accepted!');
      onUpdate();
      navigate(`/online-game?gameId=${game.id}`);
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast.error('Failed to accept challenge');
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    try {
      setResponding(true);

      // Get challenge details
      const { data: challenge, error: fetchError } = await supabase
        .from('game_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (fetchError) throw fetchError;

      // Update challenge
      const { error: updateError } = await supabase
        .from('game_challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // Notify challenger
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: challenge.challenger_id,
          type: 'challenge_declined',
          content: `${challenge.challenged_username} declined your challenge.`,
          related_id: null
        });

      if (notifError) throw notifError;

      toast.success('Challenge declined');
      onUpdate();
    } catch (error) {
      console.error('Error declining challenge:', error);
      toast.error('Failed to decline challenge');
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={responding}
        className="flex-1"
      >
        {responding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4 mr-1" />
            Accept
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDecline}
        disabled={responding}
        className="flex-1"
      >
        {responding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <X className="w-4 h-4 mr-1" />
            Decline
          </>
        )}
      </Button>
    </div>
  );
}
