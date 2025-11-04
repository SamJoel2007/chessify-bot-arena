import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Users, Bot, Flag, Handshake, Trophy, X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OnlineMatchmaking } from "@/components/OnlineMatchmaking";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface GameBoardProps {
  selectedBot?: any;
  onBotChange?: (bot: any) => void;
  userId?: string;
  username?: string;
  currentAvatar?: string;
}

export const GameBoard = ({ selectedBot, onBotChange, userId, username, currentAvatar }: GameBoardProps) => {
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [showMatchmaking, setShowMatchmaking] = useState(false);
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

  // Helper function to evaluate move quality
  const evaluateMove = (move: any, currentGame: Chess, rating: number): number => {
    const testGame = new Chess(currentGame.fen());
    testGame.move(move);
    
    let score = 0;
    
    // Material values
    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    
    // Checkmate is best
    if (testGame.isCheckmate()) {
      return 10000;
    }
    
    // Capture value - higher priority for good trades
    if (move.captured) {
      const captureValue = pieceValues[move.captured];
      const movingValue = pieceValues[move.piece];
      score += captureValue * 20;
      
      // Good trade bonus (capturing higher value)
      if (captureValue > movingValue) {
        score += (captureValue - movingValue) * 15;
      }
    }
    
    // Check is valuable
    if (testGame.isCheck()) {
      score += 25;
    }
    
    // Center control (more important in opening/middlegame)
    const moveNumber = currentGame.moveNumber();
    if (moveNumber < 20) {
      if (['e4', 'e5', 'd4', 'd5'].includes(move.to)) {
        score += 12;
      }
      if (['c4', 'c5', 'f4', 'f5'].includes(move.to)) {
        score += 8;
      }
    }
    
    // Piece development in opening
    if (moveNumber < 10) {
      // Reward knight and bishop development
      if (['n', 'b'].includes(move.piece) && ['1', '8'].includes(move.from[1])) {
        score += 10;
      }
      // Penalize moving same piece twice
      if (move.piece !== 'p' && !['1', '8'].includes(move.from[1])) {
        score -= 5;
      }
    }
    
    // Castling bonus
    if (move.flags.includes('k') || move.flags.includes('q')) {
      score += 20;
    }
    
    // Piece safety - check if piece is protected
    const defenders = testGame.attackers(move.to, currentGame.turn());
    const attackers = testGame.attackers(move.to, currentGame.turn() === 'w' ? 'b' : 'w');
    const movingPieceValue = pieceValues[move.piece];
    
    if (attackers.length > 0) {
      if (defenders.length === 0) {
        // Hanging piece - very bad
        score -= movingPieceValue * 30;
      } else if (attackers.length > defenders.length) {
        // Outnumbered - risky
        score -= movingPieceValue * 15;
      }
    }
    
    // Control of important squares (for intermediate+ bots)
    if (rating >= 1000) {
      const controlledSquares = ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'];
      const controls = controlledSquares.filter(sq => {
        const attackers = testGame.attackers(sq as any, currentGame.turn());
        return attackers.length > 0;
      }).length;
      score += controls * 3;
    }
    
    // Pawn structure (for advanced bots)
    if (rating >= 1400) {
      // Penalize doubled pawns
      if (move.piece === 'p') {
        const file = move.to[0];
        const pawnsOnFile = testGame.board().flat().filter(
          p => p && p.type === 'p' && p.color === currentGame.turn()
        ).length;
        if (pawnsOnFile > 1) score -= 8;
      }
    }
    
    return score;
  };

  const makeBotMove = (currentGame: Chess) => {
    if (currentGame.isGameOver()) return;

    setIsThinking(true);
    setTimeout(() => {
      const moves = currentGame.moves({ verbose: true });
      if (moves.length === 0) return;

      const rating = selectedBot?.rating || 1000;
      
      // Calculate blunder rate based on rating tiers
      let blunderRate: number;
      if (rating < 600) {
        blunderRate = 0.5; // Beginner: 50% blunder rate
      } else if (rating < 900) {
        blunderRate = 0.25; // Improving beginner: 25% blunder rate
      } else if (rating < 1200) {
        blunderRate = 0.10; // Low intermediate: 10% blunder rate
      } else if (rating < 1500) {
        blunderRate = 0.05; // Mid intermediate: 5% blunder rate
      } else if (rating < 1800) {
        blunderRate = 0.02; // High intermediate: 2% blunder rate
      } else {
        blunderRate = 0; // Advanced+: no blunders
      }
      
      let move;
      
      // Blunder: pick a random bad move
      if (Math.random() < blunderRate) {
        // Sort moves by score (ascending for worst moves)
        const scoredMoves = moves.map(m => ({
          move: m,
          score: evaluateMove(m, currentGame, rating)
        })).sort((a, b) => a.score - b.score);
        
        // Pick from worst 30% of moves
        const worstMoves = scoredMoves.slice(0, Math.ceil(moves.length * 0.3));
        move = worstMoves[Math.floor(Math.random() * worstMoves.length)].move;
      } else {
        // Good move: evaluate and pick based on skill
        const scoredMoves = moves.map(m => ({
          move: m,
          score: evaluateMove(m, currentGame, rating)
        })).sort((a, b) => b.score - a.score);
        
        // Determine selection pool based on rating
        let selectionPoolSize: number;
        if (rating < 600) {
          selectionPoolSize = moves.length; // Pick from all moves
        } else if (rating < 900) {
          selectionPoolSize = Math.ceil(moves.length * 0.6); // Top 60%
        } else if (rating < 1200) {
          selectionPoolSize = Math.ceil(moves.length * 0.3); // Top 30%
        } else if (rating < 1500) {
          selectionPoolSize = Math.ceil(moves.length * 0.15); // Top 15%
        } else if (rating < 1800) {
          selectionPoolSize = Math.ceil(moves.length * 0.08); // Top 8%
        } else {
          selectionPoolSize = Math.max(1, Math.ceil(moves.length * 0.03)); // Top 3%
        }
        
        const topMoves = scoredMoves.slice(0, Math.max(1, selectionPoolSize));
        
        // Determine best move selection chance based on rating
        let bestMoveChance: number;
        if (rating < 600) {
          bestMoveChance = 0.2; // 20% chance
        } else if (rating < 900) {
          bestMoveChance = 0.4; // 40% chance
        } else if (rating < 1200) {
          bestMoveChance = 0.65; // 65% chance
        } else if (rating < 1500) {
          bestMoveChance = 0.80; // 80% chance
        } else if (rating < 1800) {
          bestMoveChance = 0.90; // 90% chance
        } else {
          bestMoveChance = 0.95; // 95% chance
        }
        
        if (Math.random() < bestMoveChance) {
          move = topMoves[0].move;
        } else {
          move = topMoves[Math.floor(Math.random() * topMoves.length)].move;
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
    setGameMode(null);
    if (onBotChange) onBotChange(null);
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
              className="w-full gap-2 shadow-glow" 
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  toast.error("Please sign in to play online");
                  navigate("/auth");
                  return;
                }
                setShowMatchmaking(true);
              }}
            >
              <Zap className="w-5 h-5" />
              Find Opponent
            </Button>
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

        {/* Matchmaking Dialog */}
        <Dialog open={showMatchmaking} onOpenChange={setShowMatchmaking}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Find Online Match</DialogTitle>
            </DialogHeader>
            {userId && username && (
              <OnlineMatchmaking 
                userId={userId} 
                username={username} 
                currentAvatar={currentAvatar}
              />
            )}
          </DialogContent>
        </Dialog>

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
