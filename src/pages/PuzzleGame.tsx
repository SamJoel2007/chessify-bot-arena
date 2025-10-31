import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Chess, Square } from "chess.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Trophy, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const PuzzleGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const puzzle = location.state?.puzzle;

  const [game, setGame] = useState(new Chess(puzzle?.fen || "start"));
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string }>>({});
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);

  useEffect(() => {
    if (!puzzle) {
      navigate("/puzzles");
    }
  }, [puzzle, navigate]);

  const getMoveOptions = (square: Square) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, { background: string }> = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background: game.get(move.to as Square)
          ? "radial-gradient(circle, rgba(255,0,0,.8) 85%, transparent 85%)"
          : "radial-gradient(circle, rgba(76,175,80,.8) 25%, transparent 25%)",
      };
    });
    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
    setOptionSquares(newSquares);
    return true;
  };

  const checkSolution = (move: string) => {
    if (!puzzle || currentMoveIndex >= puzzle.solution.length) {
      return false;
    }

    const expectedMove = puzzle.solution[currentMoveIndex];
    
    // Check if the move matches the expected move (considering different notation formats)
    if (move === expectedMove || move.includes(expectedMove.replace(/[+#]/g, ""))) {
      setCurrentMoveIndex(currentMoveIndex + 1);
      setMoveHistory([...moveHistory, move]);

      if (currentMoveIndex + 1 >= puzzle.solution.length) {
        // Puzzle solved!
        setPuzzleSolved(true);
        setShowGameEndModal(true);
        toast.success("Puzzle solved! Well done!");
        return true;
      } else {
        toast.success("Correct move! Keep going!");
        return true;
      }
    } else {
      toast.error("Incorrect move. Try again!");
      return false;
    }
  };

  const makeMove = (from: Square, to: Square) => {
    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from,
        to,
        promotion: "q",
      });

      if (move === null) return false;

      const isCorrect = checkSolution(move.san);
      
      if (isCorrect) {
        setGame(gameCopy);
      }

      return isCorrect;
    } catch (error) {
      return false;
    }
  };

  const handleSquareClick = (square: Square) => {
    // If no square is selected, select this square
    if (!moveFrom) {
      const piece = game.get(square);
      if (piece) {
        const hasMoves = getMoveOptions(square);
        if (hasMoves) setMoveFrom(square);
      }
      return;
    }

    // If clicking the same square, deselect
    if (moveFrom === square) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    // Try to make the move
    const moveSuccess = makeMove(moveFrom, square);
    if (moveSuccess) {
      setMoveFrom(null);
    } else {
      // If move failed, try selecting the new square
      const piece = game.get(square);
      if (piece) {
        const hasMoves = getMoveOptions(square);
        if (hasMoves) setMoveFrom(square);
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    }
  };

  const renderBoard = () => {
    const board = game.board();
    const squares = [];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = `${String.fromCharCode(97 + j)}${8 - i}` as Square;
        const piece = board[i][j];
        const isLight = (i + j) % 2 === 0;
        const isSelected = moveFrom === square;
        const hasLegalMove = optionSquares[square];

        squares.push(
          <button
            key={square}
            onClick={() => handleSquareClick(square)}
            disabled={puzzleSolved}
            className={`
              aspect-square flex items-center justify-center text-5xl font-bold 
              transition-all duration-300 ease-in-out relative
              ${isLight ? "bg-[#EEEED2]" : "bg-[#769656]"}
              ${isSelected ? "ring-4 ring-primary ring-inset" : ""}
              ${!puzzleSolved ? "hover:brightness-95" : "cursor-not-allowed"}
              ${piece?.color === 'w' ? 'text-[#F0D9B5] drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]' : 'text-[#1a1a1a] drop-shadow-[0_3px_6px_rgba(255,255,255,0.4)] [text-shadow:_-1px_-1px_0_#fff,_1px_-1px_0_#fff,_-1px_1px_0_#fff,_1px_1px_0_#fff]'}
            `}
            style={{
              backgroundColor: hasLegalMove ? hasLegalMove.background : undefined,
            }}
          >
            {piece && (
              <span className="animate-scale-in">
                {getPieceSymbol(piece.type, piece.color)}
              </span>
            )}
            {hasLegalMove && !piece && (
              <span className="absolute w-3 h-3 rounded-full bg-green-500/80 animate-pulse" />
            )}
            {hasLegalMove && piece && moveFrom !== square && (
              <span className="absolute inset-0 ring-4 ring-red-500/60 ring-inset rounded animate-pulse" />
            )}
          </button>
        );
      }
    }

    return squares;
  };

  const getPieceSymbol = (type: string, color: string) => {
    const pieces: Record<string, Record<string, string>> = {
      w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
      b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
    };
    return pieces[color][type];
  };

  const resetPuzzle = () => {
    setGame(new Chess(puzzle?.fen || "start"));
    setMoveHistory([]);
    setCurrentMoveIndex(0);
    setOptionSquares({});
    setShowGameEndModal(false);
    setPuzzleSolved(false);
    setMoveFrom(null);
    toast("Puzzle reset!");
  };

  if (!puzzle) {
    return null;
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
              onClick={() => navigate("/puzzles")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Chessify
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/puzzles")}>
            Back to Puzzles
          </Button>
        </div>
      </header>

      {/* Game Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* Chess Board */}
          <Card className="p-6 bg-gradient-card border-border/50">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{puzzle.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{puzzle.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{puzzle.difficulty}</Badge>
                  <Badge variant="outline">{puzzle.rating} Rating</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={resetPuzzle}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            <div className="max-w-[600px] mx-auto">
              <div 
                className="grid grid-cols-8 border-4 border-border rounded-lg overflow-hidden shadow-glow"
                style={{ aspectRatio: "1/1" }}
              >
                {renderBoard()}
              </div>
            </div>
          </Card>

          {/* Puzzle Info */}
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-xl font-bold mb-4">Puzzle Progress</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Move {currentMoveIndex + 1} of {puzzle.solution.length}
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${((currentMoveIndex) / puzzle.solution.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 max-h-[400px] overflow-hidden">
              <h3 className="text-xl font-bold mb-4">Move History</h3>
              <div className="space-y-2 overflow-y-auto max-h-[300px]">
                {moveHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No moves yet</p>
                ) : (
                  moveHistory.map((move, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30"
                    >
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span className="font-medium">{move}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showGameEndModal && puzzleSolved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <Card className="p-8 max-w-md w-full mx-4 bg-gradient-card border-border/50 animate-scale-in">
            <div className="text-center">
              <div className="mb-6 animate-pulse">
                <Trophy className="w-24 h-24 mx-auto text-gold drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
              </div>
              <h2 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Puzzle Solved!
              </h2>
              <p className="text-muted-foreground mb-6">
                Congratulations! You've successfully solved the puzzle!
              </p>
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => navigate("/puzzles")}
                >
                  Back to Puzzles
                </Button>
                <Button
                  className="flex-1"
                  onClick={resetPuzzle}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PuzzleGame;
