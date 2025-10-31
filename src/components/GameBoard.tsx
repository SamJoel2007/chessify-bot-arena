import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Users, Bot, Flag, Handshake, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface GameBoardProps {
  selectedBot?: any;
  onBotChange?: (bot: any) => void;
}

export const GameBoard = ({ selectedBot, onBotChange }: GameBoardProps) => {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [gameMode, setGameMode] = useState<"friend" | "bot" | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [moveTo, setMoveTo] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string }>>({});
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);

  useEffect(() => {
    if (selectedBot) {
      setGameMode("bot");
      // Reset game state when bot is selected
      const newGame = new Chess();
      setGame(newGame);
      setMoveHistory([]);
      setSelectedSquare(null);
      setIsThinking(false);
    }
  }, [selectedBot]);

  const makeBotMove = (currentGame: Chess) => {
    if (currentGame.isGameOver()) return;

    setIsThinking(true);
    setTimeout(() => {
      const moves = currentGame.moves({ verbose: true });
      if (moves.length === 0) return;

      // Calculate difficulty based on bot rating
      const rating = selectedBot?.rating || 1000;
      let move;

      if (rating < 600) {
        // Very weak: random moves
        move = moves[Math.floor(Math.random() * moves.length)];
      } else if (rating < 1200) {
        // Beginner: mostly random, sometimes captures
        const captures = moves.filter(m => m.flags.includes('c'));
        if (captures.length > 0 && Math.random() > 0.5) {
          move = captures[Math.floor(Math.random() * captures.length)];
        } else {
          move = moves[Math.floor(Math.random() * moves.length)];
        }
      } else if (rating < 1800) {
        // Intermediate: prefers captures and checks
        const captures = moves.filter(m => m.flags.includes('c'));
        const checks = moves.filter(m => {
          const testGame = new Chess(currentGame.fen());
          testGame.move(m);
          return testGame.isCheck();
        });
        
        if (checks.length > 0 && Math.random() > 0.3) {
          move = checks[Math.floor(Math.random() * checks.length)];
        } else if (captures.length > 0 && Math.random() > 0.4) {
          move = captures[Math.floor(Math.random() * captures.length)];
        } else {
          move = moves[Math.floor(Math.random() * moves.length)];
        }
      } else {
        // Advanced: always looks for best tactical moves
        const captures = moves.filter(m => m.flags.includes('c'));
        const checks = moves.filter(m => {
          const testGame = new Chess(currentGame.fen());
          testGame.move(m);
          return testGame.isCheck();
        });
        
        if (checks.length > 0) {
          move = checks[Math.floor(Math.random() * checks.length)];
        } else if (captures.length > 0) {
          move = captures[Math.floor(Math.random() * captures.length)];
        } else {
          // Prefer center control
          const centerMoves = moves.filter(m => 
            ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'].includes(m.to)
          );
          move = centerMoves.length > 0 
            ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
            : moves[Math.floor(Math.random() * moves.length)];
        }
      }

      const gameCopy = new Chess(currentGame.fen());
      gameCopy.move(move);
      setGame(gameCopy);
      setMoveHistory(prev => [...prev, move.san]);
      setIsThinking(false);

      if (gameCopy.isCheckmate()) {
        setGameResult("lose");
        setShowGameEndModal(true);
      } else if (gameCopy.isCheck()) {
        toast("Check!");
      }
    }, 2000);
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

      setGame(gameCopy);
      setMoveHistory([...moveHistory, move.san]);
      setOptionSquares({});
      
      if (gameCopy.isCheckmate()) {
        setGameResult("win");
        setShowGameEndModal(true);
      } else if (gameCopy.isCheck()) {
        toast("Check!");
        if (gameMode === "bot") {
          makeBotMove(gameCopy);
        }
      } else if (gameMode === "bot" && !gameCopy.isGameOver()) {
        // Bot's turn
        makeBotMove(gameCopy);
      }

      return true;
    } catch (error) {
      return false;
    }
  };

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
          ? "rgba(239, 68, 68, 0.6)"
          : "rgba(34, 197, 94, 0.6)",
      };
    });
    newSquares[square] = { background: "rgba(234, 179, 8, 0.5)" };
    setOptionSquares(newSquares);
    return true;
  };

  const handleSquareClick = (square: Square) => {
    if (isThinking) return;
    
    // In bot mode, only allow white pieces
    if (gameMode === "bot" && game.turn() === "b") return;

    // If no square is selected, select this square
    if (!moveFrom) {
      const piece = game.get(square);
      if (piece && (gameMode !== "bot" || piece.color === "w")) {
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
      setMoveTo(square);
      setTimeout(() => setMoveTo(null), 300);
    } else {
      // If move failed, try selecting the new square
      const piece = game.get(square);
      if (piece && (gameMode !== "bot" || piece.color === "w")) {
        const hasMoves = getMoveOptions(square);
        if (hasMoves) setMoveFrom(square);
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setSelectedSquare(null);
    setMoveFrom(null);
    setMoveTo(null);
    setOptionSquares({});
    setIsThinking(false);
    setShowGameEndModal(false);
    setGameResult(null);
    toast("Game resigned!");
  };

  const handleDraw = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to request a draw");
        return;
      }

      // Check current coins
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        toast.error("Failed to check coins");
        return;
      }

      if (!profile || profile.coins < 20) {
        toast.error("Not enough coins! You need 20 coins to request a draw.");
        return;
      }

      // Deduct coins
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ coins: profile.coins - 20 })
        .eq("id", user.id);

      if (updateError) {
        toast.error("Failed to process draw");
        return;
      }

      // End game as draw
      setGame(new Chess());
      setMoveHistory([]);
      setSelectedSquare(null);
      setMoveFrom(null);
      setMoveTo(null);
      setOptionSquares({});
      setIsThinking(false);
      toast.success("Draw accepted! 20 coins deducted.");
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const startBotGame = () => {
    setGameMode("bot");
    resetGame();
  };

  const startFriendGame = () => {
    setGameMode("friend");
    if (onBotChange) onBotChange(null);
    resetGame();
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
            className={`
              aspect-square flex items-center justify-center text-5xl font-bold 
              transition-all duration-300 ease-in-out relative
              ${isLight ? "bg-[#EEEED2]" : "bg-[#769656]"}
              ${isSelected ? "ring-4 ring-primary ring-inset" : ""}
              hover:brightness-95
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

  return (
    <div className="grid lg:grid-cols-[1fr,400px] gap-6">
      {/* Chess Board */}
      <Card className="p-6 bg-gradient-card border-border/50">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Game Board</h2>
            {selectedBot && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Playing against:</span>
                <span className="font-semibold">{selectedBot.name}</span>
                <Badge variant="outline">{selectedBot.rating} ELO</Badge>
              </div>
            )}
            {isThinking && (
              <p className="text-sm text-muted-foreground mt-1">Bot is thinking...</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDraw}>
              <Handshake className="w-4 h-4 mr-2" />
              Draw (20 coins)
            </Button>
            <Button variant="outline" size="sm" onClick={resetGame}>
              <Flag className="w-4 h-4 mr-2" />
              Resign
            </Button>
          </div>
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

      {/* Game End Modal */}
      {showGameEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <Card className="p-8 max-w-md w-full mx-4 bg-gradient-card border-border/50 animate-scale-in">
            <div className="text-center">
              <div className="mb-6 animate-pulse">
                {gameResult === "win" ? (
                  <Trophy className="w-24 h-24 mx-auto text-gold drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
                ) : (
                  <X className="w-24 h-24 mx-auto text-destructive drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
                )}
              </div>
              <h2 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                {gameResult === "win" ? "Victory!" : "Defeat!"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {gameResult === "win" 
                  ? "Congratulations! You've won the game!" 
                  : "Better luck next time!"}
              </p>
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setShowGameEndModal(false);
                    setGameResult(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    resetGame();
                  }}
                >
                  Play Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Game Info & Actions */}
      <div className="space-y-4">
        <Card className="p-6 bg-gradient-card border-border/50">
          <h3 className="text-xl font-bold mb-4">Game Mode</h3>
          <div className="space-y-3">
            <Button 
              className="w-full gap-2" 
              variant={gameMode === "friend" ? "default" : "outline"}
              onClick={startFriendGame}
            >
              <Users className="w-5 h-5" />
              Play vs Friend
            </Button>
            <Button 
              className="w-full gap-2" 
              variant={gameMode === "bot" ? "default" : "outline"}
              onClick={startBotGame}
            >
              <Bot className="w-5 h-5" />
              Play vs Bot
            </Button>
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
                  <span className="text-muted-foreground">{Math.floor(index / 2) + 1}.</span>
                  <span className="font-medium">{move}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
