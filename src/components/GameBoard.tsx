import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Users, Bot } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    if (selectedBot) {
      setGameMode("bot");
      resetGame();
    }
  }, [selectedBot]);

  const makeBotMove = () => {
    if (game.isGameOver()) return;

    setIsThinking(true);
    setTimeout(() => {
      const moves = game.moves({ verbose: true });
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
          const testGame = new Chess(game.fen());
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
          const testGame = new Chess(game.fen());
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

      const gameCopy = new Chess(game.fen());
      gameCopy.move(move);
      setGame(gameCopy);
      setMoveHistory(prev => [...prev, move.san]);
      setIsThinking(false);

      if (gameCopy.isCheckmate()) {
        toast.error("Checkmate! You lost!");
      } else if (gameCopy.isCheck()) {
        toast("Check!");
      }
    }, 500);
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
      
      if (gameCopy.isCheckmate()) {
        toast.success("Checkmate! You won!");
      } else if (gameCopy.isCheck()) {
        toast("Check!");
      } else if (gameMode === "bot" && !gameCopy.isGameOver()) {
        // Bot's turn
        makeBotMove();
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSquareClick = (square: Square) => {
    if (isThinking) return;
    
    // In bot mode, only allow white pieces
    if (gameMode === "bot" && game.turn() === "b") return;

    if (selectedSquare) {
      makeMove(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      const piece = game.get(square);
      if (piece && (gameMode !== "bot" || piece.color === "w")) {
        setSelectedSquare(square);
      }
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setSelectedSquare(null);
    setIsThinking(false);
    toast("Game reset!");
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
        const isSelected = selectedSquare === square;

        squares.push(
          <button
            key={square}
            onClick={() => handleSquareClick(square)}
            className={`
              aspect-square flex items-center justify-center text-5xl font-bold transition-colors
              ${isLight ? "bg-[#EEEED2]" : "bg-[#769656]"}
              ${isSelected ? "ring-4 ring-primary" : ""}
              hover:opacity-80
              ${piece?.color === 'w' ? 'text-[#F0D9B5] drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]' : 'text-[#1a1a1a] drop-shadow-[0_3px_6px_rgba(255,255,255,0.4)] [text-shadow:_-1px_-1px_0_#fff,_1px_-1px_0_#fff,_-1px_1px_0_#fff,_1px_1px_0_#fff]'}
            `}
          >
            {piece && getPieceSymbol(piece.type, piece.color)}
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
          <Button variant="outline" size="sm" onClick={resetGame}>
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
