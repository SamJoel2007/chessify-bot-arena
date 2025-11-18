import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsGuest(session?.user?.is_anonymous || false);
      // Redirect only if user has a registered account (not anonymous)
      if (session && !session.user.is_anonymous) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsGuest(session?.user?.is_anonymous || false);
      // Redirect only if user has a registered account (not anonymous)
      if (session && !session.user.is_anonymous) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email, password });
      setLoading(true);

      // If guest user, convert to permanent account
      if (isGuest) {
        const { error } = await supabase.auth.updateUser({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Guest account converted! Your progress has been saved.");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to sign up");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email, password });
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Signed in successfully!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Chessify
            </h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Guest Banner */}
      {isGuest && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-3">
            <p className="text-center text-sm text-foreground">
              🎮 <strong>You're browsing as a guest.</strong> Sign up to save your progress, coins, and achievements!
            </p>
          </div>
        </div>
      )}

      {/* Auth Form Section */}
      <div className="flex items-center justify-center p-4 py-16 bg-gradient-card">
        <Card className="w-full max-w-md p-8 bg-card/50 border-border/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="text-muted-foreground">
              Sign up to save your progress and unlock all features
            </p>
          </div>

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="w-5 h-5" />
                Sign in with Google
              </Button>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="w-5 h-5" />
                Sign up with Google
              </Button>

              <div className="text-center mt-4">
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Forgot Password?
                </a>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;