import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import puzzleBeginner from "@/assets/puzzles/puzzle-beginner.jpg";
import puzzleIntermediate from "@/assets/puzzles/puzzle-intermediate.jpg";
import puzzleAdvanced from "@/assets/puzzles/puzzle-advanced.jpg";
import puzzleExpert from "@/assets/puzzles/puzzle-expert.jpg";

interface Puzzle {
  id: string;
  name: string;
  description: string;
  rating: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  image: string;
  fen: string;
  solution: string[];
}

const puzzles: Puzzle[] = [
  {
    id: "p1",
    name: "Mate in 1",
    description: "Find the winning move in this beginner puzzle",
    rating: 800,
    difficulty: "beginner",
    image: puzzleBeginner,
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
    solution: ["Qxf7#"],
  },
  {
    id: "p2",
    name: "Mate in 2",
    description: "Calculate the winning sequence in this tactical puzzle",
    rating: 1400,
    difficulty: "intermediate",
    image: puzzleIntermediate,
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    solution: ["Bxf7+", "Kxf7", "Ng5+", "Ke8", "Qh5#"],
  },
  {
    id: "p3",
    name: "Mate in 3",
    description: "Master this complex combination to achieve checkmate",
    rating: 2000,
    difficulty: "advanced",
    image: puzzleAdvanced,
    fen: "r1b1kb1r/pppp1ppp/5q2/4n3/3KP3/2N5/PPP2PPP/R1BQ1BNR w kq - 0 1",
    solution: ["Qd5", "Qf4", "Qxe5+", "Qxe5", "Nxe5"],
  },
  {
    id: "p4",
    name: "Brilliant Sacrifice",
    description: "Only the best can spot this brilliant winning move",
    rating: 2400,
    difficulty: "expert",
    image: puzzleExpert,
    fen: "r2qk2r/ppp2ppp/2n1bn2/2bpp3/4P3/2PP1N2/PP1N1PPP/R1BQKB1R w KQkq - 0 1",
    solution: ["Nxe5", "Nxe5", "Bxf7+", "Kxf7", "Qh5+"],
  },
];

const Puzzles = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load ad script
    const script = document.createElement("script");
    script.src = "//pl27964518.effectivegatecpm.com/6b73e2d7b6ada28eb7fcb5b7a7102a06/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePlayPuzzle = (puzzle: Puzzle) => {
    navigate("/puzzle-game", { state: { puzzle } });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-500 bg-green-500/20";
      case "intermediate":
        return "text-blue-500 bg-blue-500/20";
      case "advanced":
        return "text-purple-500 bg-purple-500/20";
      case "expert":
        return "text-gold bg-gold/20";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

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
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Chess Puzzles
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-card py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Sharpen Your Tactical Skills
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Solve chess puzzles from beginner to expert level and improve your game
          </p>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center">
          <div id="container-6b73e2d7b6ada28eb7fcb5b7a7102a06"></div>
        </div>
      </div>

      {/* Puzzles Grid */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {puzzles.map((puzzle) => (
            <Card
              key={puzzle.id}
              className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={puzzle.image}
                  alt={puzzle.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{puzzle.name}</h3>
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {puzzle.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${getDifficultyColor(
                      puzzle.difficulty
                    )}`}
                  >
                    {puzzle.difficulty.charAt(0).toUpperCase() +
                      puzzle.difficulty.slice(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Rating: {puzzle.rating}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handlePlayPuzzle(puzzle)}
                >
                  Play Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-4">
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 Chessify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Puzzles;
