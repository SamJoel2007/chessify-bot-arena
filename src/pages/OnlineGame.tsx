import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chess, Square } from "chess.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { getAvatarIcon } from "@/lib/avatarUtils";

export default function OnlineGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [gameData, setGameData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [isGameOver, setIsGameOver] = useState(false);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string }>>({});

  useEffect(() => {
    loadGame();
    setupRealtimeSubscription();
  }, [gameId]);

  useEffect(() => {
    if (gameData && !isGameOver) {
      const interval = setInterval(() => {
        if (game.turn() === "w") {
          setWhiteTime((prev) => Math.max(0, prev - 1));
        } else {
          setBlackTime((prev) => Math.max(0, prev - 1));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameData, game, isGameOver]);

  useEffect(() => {
    if (whiteTime === 0 || blackTime === 0) {
      handleTimeOut();
    }
  }, [whiteTime, blackTime]);

  const loadGame = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error) throw error;

      setGameData(data);
      setWhiteTime(data.white_time_remaining);
      setBlackTime(data.black_time_remaining);
      
      const chess = new Chess(data.current_fen);
      setGame(chess);

      setPlayerColor(data.white_player_id === user.id ? "w" : "b");

      if (data.status !== "active") {
        setIsGameOver(true);
      }
    } catch (error) {
      console.error("Error loading game:", error);
      toast.error("Failed to load game");
      navigate("/");
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setGameData(newData);
          setWhiteTime(newData.white_time_remaining);
          setBlackTime(newData.black_time_remaining);
          
          const chess = new Chess(newData.current_fen);
          setGame(chess);

          if (newData.status !== "active") {
            setIsGameOver(true);
            handleGameEnd(newData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleGameEnd = (data: any) => {
    if (data.winner_id === userId) {
      toast.success("You won!");
    } else if (data.winner_id) {
      toast.error("You lost!");
    } else {
      toast.info("Game ended in a draw");
    }
  };

  const handleTimeOut = async () => {
    if (isGameOver) return;
    
    const winnerId = whiteTime === 0 ? gameData.black_player_id : gameData.white_player_id;
    
    await supabase
      .from("games")
      .update({
        status: "finished",
        winner_id: winnerId,
      })
      .eq("id", gameId);

    setIsGameOver(true);
  };

  const makeMove = async (from: Square, to: Square) => {
    if (isGameOver) return false;
    if (game.turn() !== playerColor) {
      toast.error("Not your turn!");
      return false;
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from,
        to,
        promotion: "q",
      });

      if (move === null) return false;

      const newTime = game.turn() === "w" ? whiteTime : blackTime;

      // Update game in database
      const { error } = await supabase
        .from("games")
        .update({
          current_fen: gameCopy.fen(),
          current_turn: gameCopy.turn(),
          white_time_remaining: game.turn() === "w" ? newTime : whiteTime,
          black_time_remaining: game.turn() === "b" ? newTime : blackTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId);

      if (error) throw error;

      // Insert move history
      await supabase.from("game_moves").insert({
        game_id: gameId,
        move_number: game.moveNumber(),
        move_san: move.san,
        fen_after: gameCopy.fen(),
        player_id: userId,
        time_taken: 1,
      });

      // Check for game end
      if (gameCopy.isGameOver()) {
        let winnerId = null;
        if (gameCopy.isCheckmate()) {
          winnerId = playerColor === "w" ? gameData.white_player_id : gameData.black_player_id;
        }

        await supabase
          .from("games")
          .update({
            status: "finished",
            winner_id: winnerId,
          })
          .eq("id", gameId);
      }

      setGame(gameCopy);
      setOptionSquares({});
      setMoveFrom(null);
      return true;
    } catch (error) {
      console.error("Error making move:", error);
      toast.error("Failed to make move");
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
    if (isGameOver) return;
    if (game.turn() !== playerColor) {
      toast.error("Not your turn!");
      return;
    }

    // If no square is selected, select this square
    if (!moveFrom) {
      const piece = game.get(square);
      if (piece && piece.color === playerColor) {
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
    if (!moveSuccess) {
      // If move failed, try selecting the new square
      const piece = game.get(square);
      if (piece && piece.color === playerColor) {
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
    const isWhite = playerColor === "w";

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const row = isWhite ? i : 7 - i;
        const col = isWhite ? j : 7 - j;
        const square = `${String.fromCharCode(97 + col)}${8 - row}` as Square;
        const piece = board[row][col];
        const isLight = (row + col) % 2 === 0;
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!gameData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  const WhiteAvatar = gameData.white_avatar ? getAvatarIcon(gameData.white_avatar) : null;
  const BlackAvatar = gameData.black_avatar ? getAvatarIcon(gameData.black_avatar) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">10 Min Match</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[1fr,300px] gap-6">
            <div>
              <Card className="p-4 mb-4 bg-gradient-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {BlackAvatar && (
                      <div className="w-8 h-8">
                        <BlackAvatar />
                      </div>
                    )}
                    <span className="font-bold">{gameData.black_username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className={`font-mono ${blackTime < 60 ? "text-destructive" : ""}`}>
                      {formatTime(blackTime)}
                    </span>
                  </div>
                </div>
              </Card>

              <div 
                className="grid grid-cols-8 border-4 border-border rounded-lg overflow-hidden shadow-glow max-w-[600px] mx-auto"
                style={{ aspectRatio: "1/1" }}
              >
                {renderBoard()}
              </div>

              <Card className="p-4 mt-4 bg-gradient-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {WhiteAvatar && (
                      <div className="w-8 h-8">
                        <WhiteAvatar />
                      </div>
                    )}
                    <span className="font-bold">{gameData.white_username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className={`font-mono ${whiteTime < 60 ? "text-destructive" : ""}`}>
                      {formatTime(whiteTime)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-6 bg-gradient-card">
                <h3 className="font-bold mb-4">Game Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Color:</span>
                    <Badge>{playerColor === "w" ? "White" : "Black"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={isGameOver ? "outline" : "default"}>
                      {isGameOver ? "Finished" : "Active"}
                    </Badge>
                  </div>
                  {game.isCheck() && (
                    <div className="text-destructive font-bold">Check!</div>
                  )}
                  {isGameOver && (
                    <div className="mt-4">
                      <Button onClick={() => navigate("/")} className="w-full">
                        Back to Home
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}