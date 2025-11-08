import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Home, Share2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

const VictoryShowcase = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, eventName, botName, botRating } = location.state || {};

  useEffect(() => {
    if (!username) {
      navigate("/");
    }
  }, [username, navigate]);

  const handleShare = () => {
    toast.success("Take a screenshot to share your victory!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full p-8 md:p-12 bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Trophy Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <Trophy className="w-24 h-24 md:w-32 md:h-32 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Victory!
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {eventName || "Winter ARC Chess Challenge"}
            </p>
          </div>

          {/* Certificate Content */}
          <div className="border-t border-b border-border py-8 my-8 space-y-4">
            <p className="text-lg md:text-xl text-foreground/80">
              This certifies that
            </p>
            <p className="text-3xl md:text-4xl font-bold text-primary">
              {username}
            </p>
            <p className="text-lg md:text-xl text-foreground/80">
              has successfully defeated
            </p>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {botName || "Ayanokoji"}
            </p>
            <p className="text-lg text-muted-foreground">
              Rating: {botRating || 2500}
            </p>
          </div>

          {/* Date */}
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          {/* Reward Notice */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <p className="text-lg font-semibold text-primary">
              🎉 Reward: 1000 Coins Awarded!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              onClick={handleShare}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Victory
            </Button>
            <Button
              onClick={() => navigate("/")}
              size="lg"
              className="gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VictoryShowcase;
