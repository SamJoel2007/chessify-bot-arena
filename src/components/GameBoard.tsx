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
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; isCapture?: boolean }>>({});
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
  const [capturedSquare, setCapturedSquare] = useState<Square | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{ square: Square; element: HTMLElement } | null>(null);
  const [movingPiece, setMovingPiece] = useState<{ piece: string; color: string; from: Square; to: Square } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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

  // Helper function to detect hanging pieces
  const detectHangingPieces = (testGame: Chess, color: 'w' | 'b'): { square: string; piece: string; value: number }[] => {
    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const hanging: { square: string; piece: string; value: number }[] = [];
    const board = testGame.board();
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = `${String.fromCharCode(97 + j)}${8 - i}` as Square;
        const piece = board[i][j];
        
        if (piece && piece.color === color) {
          const attackers = testGame.attackers(square, color === 'w' ? 'b' : 'w');
          const defenders = testGame.attackers(square, color);
          
          if (attackers.length > 0 && defenders.length === 0) {
            hanging.push({ square, piece: piece.type, value: pieceValues[piece.type] });
          }
        }
      }
    }
    
    return hanging;
  };

  // Helper function to evaluate move quality with 3-ply look-ahead for advanced bots
  const evaluateMove = (move: any, currentGame: Chess, rating: number): number => {
    const testGame = new Chess(currentGame.fen());
    testGame.move(move);
    
    let score = 0;
    const isAdvancedBot = rating >= 1800;
    const moveNumber = currentGame.moveNumber();
    const isEndgame = moveNumber > 40 || (testGame.board().flat().filter(p => p).length < 12);
    
    // Material values
    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    
    // Checkmate is best
    if (testGame.isCheckmate()) {
      return 10000;
    }
    
    // Stalemate is bad
    if (testGame.isStalemate()) {
      return -5000;
    }
    
    // Advanced positional evaluation for strong bots
    if (isAdvancedBot) {
      const board = testGame.board();
      
      // Evaluate material and positional factors
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = board[i][j];
          if (piece && piece.color === 'b') {
            // Pawn structure bonuses
            if (piece.type === 'p') {
              // Connected pawns
              const hasConnectedPawn = [j-1, j+1].some(file => 
                file >= 0 && file < 8 && board[i][file]?.type === 'p' && board[i][file]?.color === 'b'
              );
              if (hasConnectedPawn) score += 8;
              
              // Passed pawns
              const isPassed = !board.slice(i + 1).some(rank => 
                rank[j]?.type === 'p' && rank[j]?.color === 'w'
              );
              if (isPassed) score += 20 + (6 - i) * 5;
            }
            
            // Piece activity
            if (piece.type === 'r') {
              // Rooks on open files
              const fileHasPawn = board.some(rank => rank[j]?.type === 'p');
              if (!fileHasPawn) score += 15;
            }
            
            if (piece.type === 'b') {
              // Bishops on long diagonals
              const centerDistance = Math.abs(i - 3.5) + Math.abs(j - 3.5);
              if (centerDistance < 3) score += 12;
            }
            
            if (piece.type === 'n') {
              // Knights on outposts (protected squares in enemy territory)
              if (i < 4) score += 18;
            }
            
            // King evaluation based on game phase
            if (piece.type === 'k') {
              if (isEndgame) {
                // King centralization in endgame
                const centerDistance = Math.abs(i - 3.5) + Math.abs(j - 3.5);
                score += (7 - centerDistance) * 4;
              } else {
                // King safety in middlegame
                if (i === 7) score += 15; // Back rank
              }
            }
          }
        }
      }
    }
    
    // Check for immediate mate-in-one threats
    if (testGame.isCheck()) {
      score += 50;
      const opponentMoves = testGame.moves({ verbose: true });
      if (opponentMoves.length === 0) {
        return 10000; // We deliver checkmate
      }
    }
    
    // Capture value with SEE for advanced bots
    if (move.captured) {
      const captureValue = pieceValues[move.captured];
      const movingValue = pieceValues[move.piece];
      score += captureValue * (isAdvancedBot ? 30 : 25);
      
      // Better exchange calculation for advanced bots
      if (isAdvancedBot && movingValue < captureValue) {
        score += 50; // Winning exchange
      }
    }
    
    // Tactical pattern recognition for advanced bots
    if (isAdvancedBot) {
      // Detect forks (knight/queen attacking multiple pieces)
      if (['n', 'q'].includes(move.piece)) {
        const attacks = testGame.moves({ verbose: true, square: move.to as Square })
          .filter(m => m.captured).length;
        if (attacks >= 2) score += 50;
      }
    }
    
    // 3-ply look-ahead for advanced bots, 2-ply for others
    const lookAheadDepth = isAdvancedBot ? 15 : (rating >= 1000 ? 10 : 0);
    
    if (lookAheadDepth > 0) {
      // Check if our piece becomes hanging after this move
      const hanging = detectHangingPieces(testGame, currentGame.turn());
      if (hanging.length > 0) {
        hanging.forEach(h => {
          score -= h.value * (isAdvancedBot ? 50 : 40);
        });
      }
      
      // Look for opponent's hanging pieces
      const opponentHanging = detectHangingPieces(testGame, currentGame.turn() === 'w' ? 'b' : 'w');
      opponentHanging.forEach(h => {
        score += h.value * 15;
      });
      
      // Simulate opponent's best response
      const opponentMoves = testGame.moves({ verbose: true });
      if (opponentMoves.length > 0) {
        let bestOpponentScore = -Infinity;
        opponentMoves.slice(0, lookAheadDepth).forEach(oppMove => {
          const oppTestGame = new Chess(testGame.fen());
          oppTestGame.move(oppMove);
          let oppScore = 0;
          
          if (oppMove.captured) {
            oppScore += pieceValues[oppMove.captured] * 20;
          }
          if (oppTestGame.isCheck()) {
            oppScore += 25;
          }
          
          // 3-ply for advanced bots only
          if (isAdvancedBot) {
            const counterMoves = oppTestGame.moves({ verbose: true });
            let bestCounterScore = -Infinity;
            
            counterMoves.slice(0, 8).forEach(counterMove => {
              const counterGame = new Chess(oppTestGame.fen());
              counterGame.move(counterMove);
              
              let counterScore = 0;
              if (counterMove.captured) {
                counterScore += pieceValues[counterMove.captured] * 20;
              }
              
              bestCounterScore = Math.max(bestCounterScore, counterScore);
            });
            
            oppScore -= bestCounterScore * 0.2;
          }
          
          const newHanging = detectHangingPieces(oppTestGame, currentGame.turn());
          oppScore += newHanging.reduce((sum, h) => sum + h.value * 30, 0);
          
          bestOpponentScore = Math.max(bestOpponentScore, oppScore);
        });
        
        score -= bestOpponentScore * (isAdvancedBot ? 0.4 : 0.5);
      }
    }
    
    // Center control
    if (moveNumber < 20) {
      const centerSquares = ['e4', 'e5', 'd4', 'd5'];
      const extendedCenter = ['c4', 'c5', 'f4', 'f5', 'c3', 'c6', 'f3', 'f6'];
      
      if (centerSquares.includes(move.to)) {
        score += isAdvancedBot ? 40 : 15;
      } else if (isAdvancedBot && extendedCenter.includes(move.to)) {
        score += 15;
      }
    }
    
    // Development in opening
    if (moveNumber < 10) {
      if (['n', 'b'].includes(move.piece) && ['1', '8'].includes(move.from[1])) {
        score += isAdvancedBot ? 30 : 12;
      }
    }
    
    // Castling bonus
    if (move.flags.includes('k') || move.flags.includes('q')) {
      score += isAdvancedBot ? 100 : 25;
    }
    
    // King safety
    if (rating >= 1200 && moveNumber < 25) {
      const kingSquare = testGame.board().flat().find(p => p && p.type === 'k' && p.color === currentGame.turn());
      if (kingSquare) {
        const kingPos = testGame.board().flatMap((row, i) => 
          row.map((p, j) => p && p.type === 'k' && p.color === currentGame.turn() ? 
            `${String.fromCharCode(97 + j)}${8 - i}` : null)
        ).find(s => s) as Square;
        
        const kingAttackers = testGame.attackers(kingPos, currentGame.turn() === 'w' ? 'b' : 'w');
        if (kingAttackers.length > 0) {
          score -= isAdvancedBot ? 35 : 20;
        }
      }
    }
    
    // Defending threats
    if (rating >= 1000) {
      const beforeHanging = detectHangingPieces(currentGame, currentGame.turn());
      const afterHanging = detectHangingPieces(testGame, currentGame.turn());
      
      if (beforeHanging.length > afterHanging.length) {
        const defended = beforeHanging.find(h => !afterHanging.some(a => a.square === h.square));
        if (defended) {
          score += defended.value * 25;
        }
      }
    }
    
    // Pawn structure
    if (rating >= 1400 && move.piece === 'p') {
      const file = move.to[0];
      const pawnsOnFile = testGame.board().flat().filter(
        p => p && p.type === 'p' && p.color === currentGame.turn()
      ).length;
      if (pawnsOnFile > 1) score -= 10;
    }
    
    return score;
  };

  const makeBotMove = (currentGame: Chess) => {
    if (currentGame.isGameOver()) return;

    const rating = selectedBot?.rating || 1000;
    const isAdvancedBot = rating >= 1800;
    
    // Advanced bots think longer for more realistic play
    const thinkingTime = isAdvancedBot 
      ? Math.random() * 2000 + 3000  // 3-5 seconds
      : 2000;

    setIsThinking(true);
    setTimeout(() => {
      const moves = currentGame.moves({ verbose: true });
      if (moves.length === 0) return;

      const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      
      // Calculate blunder rate
      let blunderRate: number;
      if (rating < 600) {
        blunderRate = 0.5;
      } else if (rating < 900) {
        blunderRate = 0.25;
      } else if (rating < 1200) {
        blunderRate = 0.02;
      } else if (rating < 1500) {
        blunderRate = 0.01;
      } else if (rating < 1800) {
        blunderRate = 0.005;
      } else {
        blunderRate = 0; // Advanced bots don't blunder
      }
      
      // Evaluate all moves
      const scoredMoves = moves.map(m => ({
        move: m,
        score: evaluateMove(m, currentGame, rating)
      })).sort((a, b) => b.score - a.score);
      
      // Check for forced mate for advanced bots
      if (isAdvancedBot) {
        const mateMove = scoredMoves.find(sm => sm.score >= 9000);
        if (mateMove) {
          const gameCopy = new Chess(currentGame.fen());
          gameCopy.move(mateMove.move);
          setGame(gameCopy);
          setMoveHistory(prev => [...prev, mateMove.move.san]);
          setIsThinking(false);
          
          if (gameCopy.isCheckmate()) {
            setGameResult("lose");
            setShowGameEndModal(true);
          }
          return;
        }
      }
      
      // Filter out bad moves for intermediate+ bots
      let filteredMoves = scoredMoves;
      if (rating >= 1000) {
        filteredMoves = scoredMoves.filter(sm => {
          const testGame = new Chess(currentGame.fen());
          testGame.move(sm.move);
          
          // Reject moves that hang pieces worth 3+ points
          const hanging = detectHangingPieces(testGame, currentGame.turn());
          const hangingValue = hanging.reduce((sum, h) => sum + h.value, 0);
          if (hangingValue >= 3) return false;
          
          // Reject moves that allow mate in 1
          const opponentMoves = testGame.moves({ verbose: true });
          const allowsMate = opponentMoves.some(oppMove => {
            const oppTest = new Chess(testGame.fen());
            oppTest.move(oppMove);
            return oppTest.isCheckmate();
          });
          if (allowsMate) return false;
          
          return true;
        });
        
        if (filteredMoves.length === 0) {
          filteredMoves = scoredMoves;
        }
      }
      
      let move;
      
      // Smarter blunder selection
      if (Math.random() < blunderRate) {
        let blunderRange: { start: number; end: number };
        if (rating < 1200) {
          blunderRange = { 
            start: Math.floor(filteredMoves.length * 0.6), 
            end: Math.floor(filteredMoves.length * 0.8) 
          };
        } else if (rating < 1500) {
          blunderRange = { 
            start: Math.floor(filteredMoves.length * 0.7), 
            end: Math.floor(filteredMoves.length * 0.85) 
          };
        } else {
          blunderRange = { 
            start: Math.floor(filteredMoves.length * 0.8), 
            end: Math.floor(filteredMoves.length * 0.9) 
          };
        }
        
        const blunderMoves = filteredMoves.slice(blunderRange.start, Math.max(blunderRange.end, blunderRange.start + 1));
        move = blunderMoves.length > 0 
          ? blunderMoves[Math.floor(Math.random() * blunderMoves.length)].move
          : filteredMoves[Math.floor(filteredMoves.length * 0.7)].move;
      } else {
        // Good move: tighter selection pools for advanced bots
        let selectionPoolSize: number;
        if (rating < 600) {
          selectionPoolSize = filteredMoves.length;
        } else if (rating < 900) {
          selectionPoolSize = Math.ceil(filteredMoves.length * 0.6);
        } else if (rating < 1200) {
          selectionPoolSize = Math.ceil(filteredMoves.length * 0.2);
        } else if (rating < 1500) {
          selectionPoolSize = Math.ceil(filteredMoves.length * 0.1);
        } else if (rating < 1800) {
          selectionPoolSize = Math.ceil(filteredMoves.length * 0.05);
        } else if (rating < 2000) {
          selectionPoolSize = Math.max(1, Math.ceil(filteredMoves.length * 0.01)); // Top 1%
        } else {
          selectionPoolSize = Math.max(1, Math.min(2, filteredMoves.length)); // Best 1-2 moves
        }
        
        const topMoves = filteredMoves.slice(0, Math.max(1, selectionPoolSize));
        
        // Higher best move chance for advanced bots
        let bestMoveChance: number;
        if (rating < 600) {
          bestMoveChance = 0.2;
        } else if (rating < 900) {
          bestMoveChance = 0.4;
        } else if (rating < 1200) {
          bestMoveChance = 0.7;
        } else if (rating < 1500) {
          bestMoveChance = 0.85;
        } else if (rating < 1800) {
          bestMoveChance = 0.93;
        } else if (rating < 2000) {
          bestMoveChance = 0.97;
        } else {
          bestMoveChance = 0.995; // 99.5% for 2000+
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
    }, thinkingTime);
  };

  const calculateSquarePosition = (square: Square): { x: number; y: number } => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, ..., 1=7
    return { x: file, y: rank };
  };

  const makeMove = (from: Square, to: Square) => {
    if (isAnimating) return false;
    
    try {
      const gameCopy = new Chess(game.fen());
      
      // Get the piece info before moving
      const movingPieceData = game.get(from);
      if (!movingPieceData) return false;
      
      // Check if this is a capture
      const targetPiece = game.get(to);
      const isCapture = !!targetPiece;
      
      const move = gameCopy.move({
        from,
        to,
        promotion: "q",
      });

      if (move === null) return false;

      // Start animation
      setIsAnimating(true);
      setMovingPiece({
        piece: movingPieceData.type,
        color: movingPieceData.color,
        from,
        to,
      });

      // If capture, start breakdown animation at 80% of journey
      if (isCapture) {
        setTimeout(() => {
          setCapturedSquare(to);
        }, 400); // 80% of 500ms
      }

      // Complete move after animation
      setTimeout(() => {
        setGame(gameCopy);
        setMoveHistory([...moveHistory, move.san]);
        setOptionSquares({});
        setMovingPiece(null);
        setIsAnimating(false);
        
        // Clear captured square after breakdown animation
        if (isCapture) {
          setTimeout(() => setCapturedSquare(null), 200);
        }
        
        if (gameCopy.isCheckmate()) {
          setGameResult("win");
          setShowGameEndModal(true);
        } else if (gameCopy.isCheck()) {
          toast("Check!");
          if (gameMode === "bot") {
            makeBotMove(gameCopy);
          }
        } else if (gameMode === "bot" && !gameCopy.isGameOver()) {
          makeBotMove(gameCopy);
        }
      }, 500);

      return true;
    } catch (error) {
      setIsAnimating(false);
      return false;
    }
  };

  const getMoveOptions = (square: Square) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, { background: string; isCapture?: boolean }> = {};
    moves.forEach((move) => {
      const isCapture = game.get(move.to as Square);
      newSquares[move.to] = {
        background: isCapture ? "rgba(239, 68, 68, 0.3)" : "transparent",
        isCapture: !!isCapture,
      };
    });
    newSquares[square] = { background: "rgba(234, 179, 8, 0.3)" };
    setOptionSquares(newSquares);
    return true;
  };

  const handleDragStart = (square: Square, e: React.DragEvent<HTMLButtonElement>) => {
    if (isThinking) return;
    if (gameMode === "bot" && game.turn() === "b") return;

    const piece = game.get(square);
    if (piece && (gameMode !== "bot" || piece.color === "w")) {
      const hasMoves = getMoveOptions(square);
      if (hasMoves) {
        setMoveFrom(square);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", square);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (square: Square, e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!moveFrom) return;

    const moveSuccess = makeMove(moveFrom, square);
    if (moveSuccess) {
      setMoveFrom(null);
      setMoveTo(square);
      setTimeout(() => setMoveTo(null), 600);
    } else {
      setMoveFrom(null);
      setOptionSquares({});
    }
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
      setTimeout(() => setMoveTo(null), 600);
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

        const isCaptured = capturedSquare === square;
        const isMovingFrom = movingPiece?.from === square;
        
        squares.push(
          <button
            key={square}
            draggable={!!piece && (gameMode !== "bot" || piece.color === "w") && !isAnimating}
            onDragStart={(e) => handleDragStart(square, e)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(square, e)}
            onClick={() => handleSquareClick(square)}
            className={`
              aspect-square flex items-center justify-center text-5xl font-bold 
              transition-all duration-500 ease-in-out relative cursor-pointer
              ${isLight ? "bg-[#EEEED2]" : "bg-[#769656]"}
              ${isSelected ? "ring-4 ring-primary ring-inset" : ""}
              ${hasLegalMove?.isCapture ? "bg-red-500/30" : ""}
              hover:brightness-95
              ${piece?.color === 'w' ? 'text-[#F0D9B5] drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]' : 'text-[#1a1a1a] drop-shadow-[0_3px_6px_rgba(255,255,255,0.4)] [text-shadow:_-1px_-1px_0_#fff,_1px_-1px_0_#fff,_-1px_1px_0_#fff,_1px_1px_0_#fff]'}
            `}
          >
            {piece && !isCaptured && !isMovingFrom && (
              <span>
                {getPieceSymbol(piece.type, piece.color)}
              </span>
            )}
            {piece && isCaptured && (
              <span className="animate-piece-breakdown">
                {getPieceSymbol(piece.type, piece.color)}
              </span>
            )}
            {hasLegalMove && !piece && !hasLegalMove.isCapture && (
              <div className="absolute w-8 h-8 rounded-full bg-black/40 border-2 border-black/60 animate-pulse" />
            )}
            {hasLegalMove && piece && moveFrom !== square && hasLegalMove.isCapture && (
              <div className="absolute inset-0 bg-red-500/40 animate-pulse" />
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
            className="grid grid-cols-8 border-4 border-border rounded-lg overflow-hidden shadow-glow relative"
            style={{ aspectRatio: "1/1" }}
          >
            {renderBoard()}
            
            {/* Moving Piece Overlay */}
            {movingPiece && (
              <div
                className="absolute inset-0 pointer-events-none grid grid-cols-8"
                style={{ aspectRatio: "1/1" }}
              >
                {(() => {
                  const fromPos = calculateSquarePosition(movingPiece.from);
                  const toPos = calculateSquarePosition(movingPiece.to);
                  const deltaX = (toPos.x - fromPos.x) * 100; // percentage
                  const deltaY = (toPos.y - fromPos.y) * 100; // percentage
                  
                  return (
                    <div
                      className="absolute text-5xl font-bold animate-piece-slide"
                      style={{
                        left: `${fromPos.x * 12.5}%`,
                        top: `${fromPos.y * 12.5}%`,
                        width: '12.5%',
                        height: '12.5%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '--tw-slide-from-x': '0%',
                        '--tw-slide-from-y': '0%',
                        '--tw-slide-to-x': `${deltaX}%`,
                        '--tw-slide-to-y': `${deltaY}%`,
                        color: movingPiece.color === 'w' ? '#F0D9B5' : '#1a1a1a',
                        filter: movingPiece.color === 'w' 
                          ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.9))' 
                          : 'drop-shadow(0 6px 12px rgba(255,255,255,0.4))',
                        textShadow: movingPiece.color === 'w'
                          ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
                          : '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
                      } as React.CSSProperties}
                    >
                      {getPieceSymbol(movingPiece.piece, movingPiece.color)}
                    </div>
                  );
                })()}
              </div>
            )}
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
