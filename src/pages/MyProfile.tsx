import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Trophy, Coins, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { toast } from "sonner";

const MyProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to view your profile");
        navigate("/auth");
        return;
      }

      // Allow guests to view profile but with limited features
      setUser(session.user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
        console.error(error);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Delete old profile picture if exists
      if (profile?.profile_picture_url) {
        const oldPath = profile.profile_picture_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, profile_picture_url: publicUrl });
      toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "bronze":
        return "text-orange-700 bg-orange-100 dark:bg-orange-950/30";
      case "silver":
        return "text-gray-400 bg-gray-100 dark:bg-gray-800/30";
      case "gold":
        return "text-gold bg-gold/20";
      case "diamond":
        return "text-cyan-400 bg-cyan-100 dark:bg-cyan-950/30";
      case "platinum":
        return "text-purple-400 bg-purple-100 dark:bg-purple-950/30";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                My Profile
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <Card className="p-8 bg-gradient-card border-border/50 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar with Upload */}
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-primary">
                  {profile?.profile_picture_url ? (
                    <AvatarImage src={profile.profile_picture_url} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-gradient-primary text-6xl">
                      {getAvatarIcon(profile?.current_avatar)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">{profile?.username || "Player"}</h2>
                <p className="text-lg text-muted-foreground mb-4">{user?.email}</p>
                
                {/* Rank Badge */}
                <div className="flex justify-center md:justify-start">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getRankColor(profile?.rank || "bronze")}`}>
                    <Trophy className="w-4 h-4" />
                    {(profile?.rank || "bronze").charAt(0).toUpperCase() + (profile?.rank || "bronze").slice(1)} Rank
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Points Card */}
            <Card className="p-6 bg-card/50 border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                  <p className="text-3xl font-bold">{profile?.points || 0}</p>
                </div>
              </div>
            </Card>

            {/* Credits Card */}
            <Card className="p-6 bg-card/50 border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gold/20">
                  <Coins className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Credits Balance</p>
                  <p className="text-3xl font-bold text-gold">{profile?.coins || 0}</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => navigate("/purchase-coins")}
              >
                Purchase More Credits
              </Button>
            </Card>
          </div>

          {/* Additional Info */}
          <Card className="p-6 bg-card/50 border-border/50 mt-6">
            <h3 className="text-xl font-bold mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-sm">{user?.id?.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Member Since</span>
                <span>{new Date(profile?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Current Avatar</span>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-primary text-xl">
                    {getAvatarIcon(profile?.current_avatar)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 Chessify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MyProfile;
