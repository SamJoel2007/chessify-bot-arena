import { useState } from "react";
import { Chess, Square } from "chess.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Users, Bot } from "lucide-react";
import { toast } from "sonner";

export const GameBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

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
        toast.success("Checkmate!");
      } else if (gameCopy.isCheck()) {
        toast("Check!");
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSquareClick = (square: Square) => {
    if (selectedSquare) {
      makeMove(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      const piece = game.get(square);
      if (piece) {
        setSelectedSquare(square);
      }
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setSelectedSquare(null);
    toast("Game reset!");
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
              ${isLight ? "bg-slate-200" : "bg-slate-700"}
              ${isSelected ? "ring-4 ring-primary" : ""}
              hover:opacity-80
              ${piece?.color === 'w' ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-gray-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]'}
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
          <h2 className="text-2xl font-bold">Game Board</h2>
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
            <Button className="w-full gap-2" variant="default">
              <Users className="w-5 h-5" />
              Play vs Friend
            </Button>
            <Button className="w-full gap-2" variant="outline">
              <Users className="w-5 h-5" />
              Play vs Random
            </Button>
            <Button className="w-full gap-2" variant="outline">
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
