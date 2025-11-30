import { Helmet } from "react-helmet-async";
import { Crown, Zap, Trophy, Users, Shield, Target, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Play Against AI Bots",
      description: "Challenge our collection of AI opponents with varying skill levels, from beginner to grandmaster rating."
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Online Multiplayer",
      description: "Connect with chess players worldwide in real-time matches with multiple time control options."
    },
    {
      icon: <Trophy className="w-8 h-8 text-primary" />,
      title: "Daily Quests & Rewards",
      description: "Complete daily challenges to earn coins and unlock new content. Track your progress and compete on leaderboards."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: "Chess Puzzles",
      description: "Sharpen your tactical skills with thousands of puzzles ranging from beginner to expert difficulty."
    },
    {
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      title: "AI Chess Coach",
      description: "Get personalized chess training and game analysis from our advanced AI coach powered by cutting-edge technology."
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Earn Certificates",
      description: "Unlock achievement certificates by defeating special bots and completing milestones in your chess journey."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Chessify - Your Ultimate Online Chess Platform</title>
        <meta name="description" content="Chessify is a comprehensive online chess platform offering AI opponents, multiplayer games, daily quests, puzzles, and personalized coaching. Learn about our mission to make chess accessible and enjoyable for everyone." />
        <meta name="keywords" content="about chessify, online chess platform, chess learning, chess training, AI chess bots, multiplayer chess, chess community, chess improvement, best chess openings for beginners, best chess openings for white, chess openings for beginners, best chess openings for black, chess openings for black" />
        <link rel="canonical" href="https://chessify.lovable.app/about" />
        
        {/* Open Graph */}
        <meta property="og:title" content="About Chessify - Your Ultimate Online Chess Platform" />
        <meta property="og:description" content="Discover Chessify's mission to make chess accessible to everyone through AI opponents, multiplayer games, puzzles, and personalized coaching." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://chessify.lovable.app/about" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Chessify - Your Ultimate Online Chess Platform" />
        <meta name="twitter:description" content="Learn about Chessify's comprehensive chess platform with AI bots, multiplayer, puzzles, and more." />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Crown className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              About Chessify
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your ultimate destination for online chess. Whether you're a beginner learning the basics or an experienced player honing your skills, Chessify provides the tools, opponents, and community you need to improve.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 bg-gradient-card border-border/60">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-primary" />
              <CardTitle className="text-3xl">Our Mission</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-lg text-muted-foreground leading-relaxed space-y-4">
            <p>
              At Chessify, we believe chess should be accessible, enjoyable, and educational for everyone. Our mission is to create a comprehensive online chess platform that combines cutting-edge AI technology with community-driven features to help players of all skill levels improve their game.
            </p>
            <p>
              We're passionate about making chess learning engaging through gamification, daily challenges, and personalized coaching. Whether you want to play casual games with friends, compete in tournaments, or systematically improve through puzzles and AI analysis, Chessify has you covered.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card border-border/60 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="mb-3">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Chessify */}
        <Card className="mb-12 bg-gradient-card border-border/60">
          <CardHeader>
            <CardTitle className="text-3xl">Why Choose Chessify?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong className="text-foreground">Comprehensive Learning Path:</strong> From beginner tutorials to advanced strategies, we provide structured content to guide your chess journey.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong className="text-foreground">AI-Powered Training:</strong> Our intelligent chess coach analyzes your games and provides personalized recommendations to help you improve.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong className="text-foreground">Active Community:</strong> Join thousands of chess enthusiasts in our community chat, tournaments, and competitive leaderboards.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong className="text-foreground">Flexible Game Modes:</strong> Play quick bullet games, classical matches, or challenge specific bots tailored to your skill level.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong className="text-foreground">Gamification & Rewards:</strong> Stay motivated with daily quests, coin rewards, achievement certificates, and unlockable content.</p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Chess Game?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join Chessify today and start your journey to chess mastery with our comprehensive platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/bots")} className="gap-2">
              <Zap className="w-5 h-5" />
              Challenge a Bot
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/puzzles")} className="gap-2">
              <Sparkles className="w-5 h-5" />
              Solve Puzzles
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/community")} className="gap-2">
              <Users className="w-5 h-5" />
              Join Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
