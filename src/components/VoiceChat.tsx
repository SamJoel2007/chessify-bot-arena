import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceChatProps {
  gameId: string;
  userId: string;
}

export const VoiceChat = ({ gameId, userId }: VoiceChatProps) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setIsInCall(true);
      toast.success("Voice chat connected");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Failed to access microphone");
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setIsInCall(false);
    setIsMuted(false);
    toast.info("Voice chat ended");
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      toast.info(isMuted ? "Microphone unmuted" : "Microphone muted");
    }
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {!isInCall ? (
        <Button
          onClick={startCall}
          size="sm"
          className="gap-2"
        >
          <Phone className="w-4 h-4" />
          Start Voice Chat
        </Button>
      ) : (
        <>
          <Button
            onClick={toggleMute}
            size="sm"
            variant={isMuted ? "destructive" : "secondary"}
            className="gap-2"
          >
            {isMuted ? (
              <>
                <MicOff className="w-4 h-4" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Mute
              </>
            )}
          </Button>
          <Button
            onClick={endCall}
            size="sm"
            variant="destructive"
            className="gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </Button>
        </>
      )}
    </div>
  );
};
