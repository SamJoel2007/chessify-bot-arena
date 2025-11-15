import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chess, Square } from "chess.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { playMoveSound, playCaptureSound } from "@/lib/soundUtils";
import { VoiceChat } from "@/components/VoiceChat";
import { GameChat } from "@/components/GameChat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [username, setUsername] = useState<string>("");
  const [isPlayingBot, setIsPlayingBot] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [opponentIsGuest, setOpponentIsGuest] = useState(false);
  
  // Draw and resign states
  const [drawOffer, setDrawOffer] = useState<any>(null);
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState<Date>(new Date());
  const [afkWarning, setAfkWarning] = useState(false);
  
  // Use ref to store userId for immediate synchronous access in closures
  const userIdRef = useRef<string>("");
  
  // Animation states
  const [movingPiece, setMovingPiece] = useState<{ piece: string; color: string; from: Square; to: Square } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [capturedSquare, setCapturedSquare] = useState<Square | null>(null);
  
  // Captured pieces tracking
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  
  // Bot names used for detection - must match OnlineMatchmaking bot pools
  const botNames = [
    // Beginner bots
    "Noob2009", "xXSam_ProXx", "CoolGamer123", "JakeTheBeast", 
    "PawnMaster88", "ChessNewbie", "KingKiller2010", "EpicPlayer99",
    // Intermediate bots
    "ProGamer2008", "xXDarkKnightXx", "QueenSlayer420", "TacticalTom07", 
    "ChessMaster2k", "ShadowKing666", "LegendaryPlayer", "GrandpaChess",
    // Advanced bots
    "Suii2007", "xXAlexTheProXx", "MikeYT_Gaming", "DanTheChamp99", 
    "ElitePlayer2k23", "MattyChessGod", "StrategicEmily", "Matt_Pro2012",
    // Expert bots
    "SugmaBalls", "Jack420Blaze", "SofiaGaming2k", "BasedChessLord", 
    "xXAveryProXx", "D4vidTheKing", "EllaTheQueen", "Joe_Chess_Pro",
    // Master bots
    "Sam2007YT", "CarterGaming", "VictoriaChess", "Owen_TheBeast", 
    "AriaProPlayer", "WyattLegend99", "GraceTheChamp", "JohnnyChess2k",
    // Grandmaster bots
    "ChloeMasterYT", "xXLukeGodXx", "CamilaChessGM", "JulianProGamer", 
    "PenelopeElite", "GraysonTheGOAT", "LaylaGrandMaster", "JackTheChessKing"
  ];

  // Normalize IDs by trimming whitespace and converting to lowercase for consistent comparison
  const normalizeId = (id: string | null | undefined): string => {
    return (id || "").trim().toLowerCase();
  };

  const getPlayerInfo = async () => {
    // Check if authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      
      return { 
        type: 'user', 
        id: user.id, 
        username: profile?.username || 'Player'
      };
    }
    
    // Check for guest session
    const guestToken = localStorage.getItem('guest_session_token');
    const guestId = localStorage.getItem('guest_player_id');
    const guestName = localStorage.getItem('guest_display_name');
    
    if (guestToken && guestId) {
      const { data } = await supabase
        .from('guest_players')
        .select('*')
        .eq('id', guestId)
        .eq('session_token', guestToken)
        .single();
      
      if (data && new Date(data.expires_at) > new Date()) {
        return { 
          type: 'guest', 
          id: data.id, 
          username: guestName || data.display_name
        };
      }
    }
    
    return null;
  };

  useEffect(() => {
    loadGame();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
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

  // AFK detection
  useEffect(() => {
    if (!gameData || isGameOver || isPlayingBot) return;
    
    const checkAfk = setInterval(() => {
      const now = new Date();
      const timeSinceLastMove = (now.getTime() - lastMoveTime.getTime()) / 1000; // seconds
      
      // Only check if it's player's turn
      if (game.turn() === playerColor) {
        // Warn at 2 minutes of inactivity
        if (timeSinceLastMove > 120 && !afkWarning) {
          setAfkWarning(true);
          toast.warning("⚠️ Are you still there? Make a move or you'll be auto-resigned!");
        }
        
        // Auto-resign at 3 minutes of inactivity
        if (timeSinceLastMove > 180) {
          handleAfkResign();
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(checkAfk);
  }, [gameData, isGameOver, isPlayingBot, lastMoveTime, playerColor, afkWarning, game]);

  const loadGame = async () => {
    try {
      const playerInfo = await getPlayerInfo();
      if (!playerInfo) {
        navigate("/auth");
        return;
      }
      
      const currentUserId = playerInfo.id;
      console.log("Loading game with user ID:", currentUserId);
      setUserId(currentUserId);
      userIdRef.current = currentUserId; // Store in ref immediately for synchronous access
      setUsername(playerInfo.username);
      setIsGuest(playerInfo.type === 'guest');

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error) throw error;

      console.log("Game loaded:", {
        gameId: data.id,
        whitePlayerId: data.white_player_id,
        blackPlayerId: data.black_player_id,
        currentUserId: currentUserId,
        winnerId: data.winner_id
      });

      setGameData(data);
      setWhiteTime(data.white_time_remaining);
      setBlackTime(data.black_time_remaining);
      
      const chess = new Chess(data.current_fen);
      setGame(chess);

      setPlayerColor(data.white_player_id === playerInfo.id ? "w" : "b");

      // Check if opponent is guest
      const isWhitePlayer = data.white_player_id === playerInfo.id;
      const opponentType = isWhitePlayer ? data.black_player_type : data.white_player_type;
      setOpponentIsGuest(opponentType === 'guest');

      // Check if playing against a bot by checking opponent's username
      const opponentUsername = isWhitePlayer ? data.black_username : data.white_username;
      const playingBot = botNames.includes(opponentUsername);
      console.log("[BOT] Bot detection:", {
        opponentUsername,
        isBot: playingBot,
        botNames: botNames.slice(0, 5) + '... (total: ' + botNames.length + ')'
      });
      setIsPlayingBot(playingBot);

      if (data.status !== "active") {
        setIsGameOver(true);
      } else if (playingBot && chess.turn() !== (isWhitePlayer ? "w" : "b")) {
        // If it's bot's turn when loading, make bot move
        console.log("[BOT] Bot's turn on load, triggering bot move");
        setTimeout(() => makeBotMove(chess), 1000);
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
          console.log("[REALTIME] Received game update:", payload);
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Detect if opponent made a move (FEN changed)
          if (oldData.current_fen !== newData.current_fen) {
            console.log("[REALTIME] FEN changed - opponent made a move");
            console.log("[REALTIME] New turn:", newData.current_turn);
            
            // Check if it was a capture by comparing piece counts
            const oldPieceCount = oldData.current_fen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
            const newPieceCount = newData.current_fen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
            const wasCapture = newPieceCount < oldPieceCount;
            
            // Play sound effect for opponent's move
            if (wasCapture) {
              playCaptureSound();
            } else {
              playMoveSound();
            }
          }
          
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

    // Setup draw offers subscription
    const drawChannel = supabase
      .channel(`draw_offers:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_draw_offers",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const offer = payload.new as any;
          // Only show if offered by opponent
          if (offer.offered_by !== userId && offer.status === "pending") {
            setDrawOffer(offer);
            setShowDrawDialog(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(drawChannel);
    };
  };

  const handleGameEnd = (data: any) => {
    console.log("=== GAME END DEBUG ===");
    const currentUserId = userIdRef.current || userId; // Use ref first, fall back to state
    console.log("Winner ID from DB:", data.winner_id);
    console.log("Current user ID (ref):", userIdRef.current);
    console.log("Current user ID (state):", userId);
    console.log("Using ID:", currentUserId);
    console.log("White player ID:", data.white_player_id);
    console.log("Black player ID:", data.black_player_id);
    console.log("Player color:", playerColor);
    
    // If we still don't have userId, determine result from player color
    if (!currentUserId) {
      console.warn("WARNING: userId not available, using player color to determine result");
      if (data.winner_id) {
        // Check if winner matches our color
        const isWhitePlayer = playerColor === "w";
        const weWon = isWhitePlayer 
          ? normalizeId(data.winner_id) === normalizeId(data.white_player_id)
          : normalizeId(data.winner_id) === normalizeId(data.black_player_id);
        
        setGameResult(weWon ? "win" : "loss");
      } else {
        setGameResult("draw");
      }
      setShowResultDialog(true);
      return;
    }
    
    // Normal logic with userId available
    if (normalizeId(data.winner_id) === normalizeId(currentUserId)) {
      console.log("RESULT: Victory!");
      setGameResult("win");
    } else if (data.winner_id) {
      console.log("RESULT: Defeat");
      setGameResult("loss");
    } else {
      console.log("RESULT: Draw");
      setGameResult("draw");
    }
    
    setShowResultDialog(true);
  };

  const handleResign = async () => {
    if (!gameData || isGameOver) return;
    
    const confirmed = window.confirm("Are you sure you want to resign?");
    if (!confirmed) return;
    
    const opponentId = playerColor === "w" ? gameData.black_player_id : gameData.white_player_id;
    
    await supabase
      .from("games")
      .update({
        status: "finished",
        winner_id: opponentId,
      })
      .eq("id", gameId);

    // Update points
    if (!isPlayingBot) {
      if (!isGuest) {
        await supabase.rpc('update_user_points', {
          user_id: userId,
          points_change: -5
        });
      }
      if (!opponentIsGuest) {
        await supabase.rpc('update_user_points', {
          user_id: opponentId,
          points_change: 10
        });
      }
    } else if (!isGuest) {
      await supabase.rpc('update_user_points', {
        user_id: userId,
        points_change: -5
      });
    }

    setIsGameOver(true);
    toast.success("You resigned from the game");
  };

  const handleOfferDraw = async () => {
    if (!gameData || isGameOver || isPlayingBot) return;
    
    // Check if there's already a pending draw offer
    const { data: existing } = await supabase
      .from("game_draw_offers")
      .select("*")
      .eq("game_id", gameId)
      .eq("status", "pending")
      .maybeSingle();
      
    if (existing) {
      toast.error("A draw offer is already pending");
      return;
    }
    
    const { error } = await supabase
      .from("game_draw_offers")
      .insert({
        game_id: gameId,
        offered_by: userId,
        status: "pending"
      });
      
    if (error) {
      toast.error("Failed to offer draw");
      return;
    }
    
    toast.success("Draw offer sent to opponent");
  };

  const handleAcceptDraw = async () => {
    if (!drawOffer) return;
    
    // Update game to draw
    await supabase
      .from("games")
      .update({
        status: "finished",
        winner_id: null,
      })
      .eq("id", gameId);
      
    // Update draw offer status
    await supabase
      .from("game_draw_offers")
      .update({ status: "accepted" })
      .eq("id", drawOffer.id);
      
    setShowDrawDialog(false);
    setIsGameOver(true);
    toast.success("Draw accepted");
  };

  const handleDeclineDraw = async () => {
    if (!drawOffer) return;
    
    await supabase
      .from("game_draw_offers")
      .update({ status: "declined" })
      .eq("id", drawOffer.id);
      
    setShowDrawDialog(false);
    setDrawOffer(null);
    toast.info("Draw offer declined");
  };

  const handleAfkResign = async () => {
    if (!gameData) return;
    
    const opponentId = playerColor === "w" ? gameData.black_player_id : gameData.white_player_id;
    
    await supabase
      .from("games")
      .update({
        status: "finished",
        winner_id: opponentId,
      })
      .eq("id", gameId);

    // Update points
    if (!isGuest) {
      await supabase.rpc('update_user_points', {
        user_id: userId,
        points_change: -5
      });
    }
    if (!opponentIsGuest && !isPlayingBot) {
      await supabase.rpc('update_user_points', {
        user_id: opponentId,
        points_change: 10
      });
    }

    setIsGameOver(true);
    toast.error("You were auto-resigned due to inactivity");
  };

  const handleTimeOut = async () => {
    if (isGameOver) return;
    
    const winnerId = whiteTime === 0 ? gameData.black_player_id : gameData.white_player_id;
    const loserId = whiteTime === 0 ? gameData.white_player_id : gameData.black_player_id;
    
    await supabase
      .from("games")
      .update({
        status: "finished",
        winner_id: winnerId,
      })
      .eq("id", gameId);

    // Update points - only for real player if playing bot
    if (isPlayingBot) {
      if (winnerId === userId) {
        await supabase.rpc('update_user_points', {
          user_id: userId,
          points_change: 10
        });
      } else {
        await supabase.rpc('update_user_points', {
          user_id: userId,
          points_change: -5
        });
      }
    } else {
      // Both real players
      await supabase.rpc('update_user_points', {
        user_id: winnerId,
        points_change: 10
      });

      await supabase.rpc('update_user_points', {
        user_id: loserId,
        points_change: -5
      });
    }

    setIsGameOver(true);
  };

  const evaluatePosition = (chess: Chess): number => {
    let score = 0;
    const pieceValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    
    const board = chess.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type];
          score += piece.color === 'w' ? value : -value;
        }
      }
    }
    return score;
  };

  const makeBotMove = async (currentGame: Chess) => {
    if (currentGame.isGameOver() || isGameOver) return;
    
    setIsBotThinking(true);
    
    // Bot thinks for 2-4 seconds for realism
    setTimeout(async () => {
      const moves = currentGame.moves({ verbose: true });
      if (moves.length === 0) {
        setIsBotThinking(false);
        return;
      }

      // Evaluate all moves
      const scoredMoves = moves.map(m => {
        const testGame = new Chess(currentGame.fen());
        testGame.move(m);
        const score = evaluatePosition(testGame);
        // Adjust score based on bot's color
        const botColor = playerColor === "w" ? "b" : "w";
        return {
          move: m,
          score: botColor === "w" ? score : -score
        };
      }).sort((a, b) => b.score - a.score);

      // Bot plays one of the top 3 moves (75% best, 20% second best, 5% third best)
      const rand = Math.random();
      const selectedMove = rand < 0.75 
        ? scoredMoves[0].move 
        : rand < 0.95 && scoredMoves.length > 1
        ? scoredMoves[1].move
        : scoredMoves[Math.min(2, scoredMoves.length - 1)].move;

      const from = selectedMove.from as Square;
      const to = selectedMove.to as Square;

      try {
        const gameCopy = new Chess(currentGame.fen());
        
        // Get piece info before moving
        const movingPieceData = currentGame.get(from);
        const capturedPiece = gameCopy.get(to);
        const isCapture = !!capturedPiece;
        const playerWhoMoved = gameCopy.turn();
        
        const move = gameCopy.move({
          from,
          to,
          promotion: "q",
        });

        if (move === null) {
          setIsBotThinking(false);
          return;
        }

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
          }, 400);
        }

        // Play sound effect
        if (isCapture) {
          playCaptureSound();
        } else {
          playMoveSound();
        }

        // Complete move after animation
        setTimeout(async () => {
          await completeBotMove(gameCopy, move, playerWhoMoved, from, to, isCapture);
        }, 500);

      } catch (error) {
        console.error("Error making bot move:", error);
        setIsAnimating(false);
        setMovingPiece(null);
        setIsBotThinking(false);
      }
    }, Math.random() * 2000 + 2000);
  };

  // Helper function to complete bot move after animation
  const completeBotMove = async (gameCopy: Chess, move: any, playerWhoMoved: string, from: Square, to: Square, isCapture: boolean) => {
    try {
      // Calculate time
      const botTime = playerWhoMoved === "w" ? whiteTime : blackTime;
      const updatedWhiteTime = playerWhoMoved === "w" ? botTime : whiteTime;
      const updatedBlackTime = playerWhoMoved === "b" ? botTime : blackTime;

      // Update game in database and track last move time
      const now = new Date();
      setLastMoveTime(now);
      setAfkWarning(false);
      
      const { error } = await supabase
        .from("games")
        .update({
          current_fen: gameCopy.fen(),
          current_turn: gameCopy.turn(),
          white_time_remaining: updatedWhiteTime,
          black_time_remaining: updatedBlackTime,
          updated_at: now.toISOString(),
          last_move_at: now.toISOString(),
        })
        .eq("id", gameId);

      if (error) throw error;

      // Insert move history
      const botPlayerId = playerColor === "w" ? gameData.black_player_id : gameData.white_player_id;
      await supabase.from("game_moves").insert({
        game_id: gameId,
        move_number: gameCopy.moveNumber() - 1,
        move_san: move.san,
        fen_after: gameCopy.fen(),
        player_id: botPlayerId,
        time_taken: 1,
      });

      // Check for game end
      if (gameCopy.isGameOver()) {
        let winnerId = null;
        if (gameCopy.isCheckmate()) {
          winnerId = playerColor === "w" ? gameData.black_player_id : gameData.white_player_id;
        }

        await supabase
          .from("games")
          .update({
            status: "finished",
            winner_id: winnerId,
          })
          .eq("id", gameId);

        // Update points for player only (bot is fake)
        if (winnerId) {
          if (winnerId === userId) {
            await supabase.rpc('update_user_points', {
              user_id: userId,
              points_change: 10
            });
          } else {
            await supabase.rpc('update_user_points', {
              user_id: userId,
              points_change: -5
            });
          }
        }
      }

      // Track captured piece
      if (isCapture && move.captured) {
        if (playerWhoMoved === 'w') {
          setCapturedByWhite(prev => [...prev, move.captured]);
        } else {
          setCapturedByBlack(prev => [...prev, move.captured]);
        }
      }
      
      setGame(gameCopy);
      setMovingPiece(null);
      setIsAnimating(false);
      
      // Clear captured square after breakdown animation
      if (isCapture) {
        setTimeout(() => setCapturedSquare(null), 200);
      }
    } catch (error) {
      console.error("Error completing bot move:", error);
    } finally {
      setIsBotThinking(false);
    }
  };

  const makeMove = async (from: Square, to: Square) => {
    if (isGameOver || isAnimating) return false;
    if (game.turn() !== playerColor) {
      toast.error("Not your turn!");
      return false;
    }

    try {
      console.log("[MOVE] Making move:", { from, to, currentTurn: game.turn(), playerColor });
      
      const gameCopy = new Chess(game.fen());
      
      // Get piece info before moving
      const movingPieceData = game.get(from);
      if (!movingPieceData) return false;
      
      const capturedPiece = gameCopy.get(to);
      const isCapture = !!capturedPiece;
      
      // Capture the player who is making the move BEFORE the move is made
      const playerWhoMoved = game.turn();
      
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

      // Play sound effect
      if (isCapture) {
        playCaptureSound();
      } else {
        playMoveSound();
      }

      // Complete move after animation
      setTimeout(async () => {
        await completeMove(gameCopy, move, playerWhoMoved, from, to, isCapture);
      }, 500);

      return true;
    } catch (error) {
      console.error("Error making move:", error);
      toast.error("Failed to make move");
      setIsAnimating(false);
      setMovingPiece(null);
      return false;
    }
  };

  // Helper function to complete the move after animation
  const completeMove = async (gameCopy: Chess, move: any, playerWhoMoved: string, from: Square, to: Square, isCapture: boolean) => {
    try {
      // Track captured piece
      if (isCapture && move.captured) {
        if (playerWhoMoved === 'w') {
          setCapturedByWhite(prev => [...prev, move.captured]);
        } else {
          setCapturedByBlack(prev => [...prev, move.captured]);
        }
      }
      
      // Calculate time for the player who just moved
      const updatedWhiteTime = playerWhoMoved === "w" ? whiteTime : whiteTime;
      const updatedBlackTime = playerWhoMoved === "b" ? blackTime : blackTime;

      console.log("[MOVE] Updating database:", {
        newFEN: gameCopy.fen(),
        newTurn: gameCopy.turn(),
        whiteTime: updatedWhiteTime,
        blackTime: updatedBlackTime,
      });

      // Update game in database and track last move time
      const now = new Date();
      setLastMoveTime(now);
      setAfkWarning(false);
      
      const { error } = await supabase
        .from("games")
        .update({
          current_fen: gameCopy.fen(),
          current_turn: gameCopy.turn(),
          white_time_remaining: updatedWhiteTime,
          black_time_remaining: updatedBlackTime,
          updated_at: now.toISOString(),
          last_move_at: now.toISOString(),
        })
        .eq("id", gameId);

      if (error) throw error;
      
      console.log("[MOVE] Database updated successfully");

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
          // The player who just moved delivered checkmate, so they win
          winnerId = userId;
        }

        await supabase
          .from("games")
          .update({
            status: "finished",
            winner_id: winnerId,
          })
          .eq("id", gameId);

        // Update points for both players
        if (winnerId) {
          const loserId = winnerId === gameData.white_player_id 
            ? gameData.black_player_id 
            : gameData.white_player_id;

          // Only update points for real player if playing bot
          if (isPlayingBot) {
            if (winnerId === userId) {
              await supabase.rpc('update_user_points', {
                user_id: userId,
                points_change: 10
              });
            } else {
              await supabase.rpc('update_user_points', {
                user_id: userId,
                points_change: -5
              });
            }
          } else {
            // Both are real players
            await supabase.rpc('update_user_points', {
              user_id: winnerId,
              points_change: 10
            });

            await supabase.rpc('update_user_points', {
              user_id: loserId,
              points_change: -5
            });
          }
        }
      }

      // Optimistic UI update - show the move immediately
      setGame(gameCopy);
      setOptionSquares({});
      setMoveFrom(null);
      setMovingPiece(null);
      setIsAnimating(false);
      
      // Clear captured square after breakdown animation
      if (isCapture) {
        setTimeout(() => setCapturedSquare(null), 200);
      }
      
      console.log("[MOVE] Optimistic UI update complete, waiting for realtime confirmation");
      
      // Trigger bot move if playing against bot and it's bot's turn
      console.log("[BOT] Checking if bot should move:", {
        isPlayingBot,
        currentTurn: gameCopy.turn(),
        playerColor,
        isGameOver: gameCopy.isGameOver(),
        shouldTrigger: isPlayingBot && gameCopy.turn() !== playerColor && !gameCopy.isGameOver()
      });
      
      if (isPlayingBot && gameCopy.turn() !== playerColor && !gameCopy.isGameOver()) {
        console.log("[BOT] Triggering bot move");
        setTimeout(() => makeBotMove(gameCopy), 1000);
      }
    } catch (error) {
      console.error("Error completing move:", error);
      toast.error("Failed to complete move");
      setIsAnimating(false);
      setMovingPiece(null);
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

  const handleDragStart = (square: Square, e: React.DragEvent<HTMLButtonElement>) => {
    if (isGameOver || isBotThinking || isAnimating) return;
    if (game.turn() !== playerColor) return;

    const piece = game.get(square);
    if (piece && piece.color === playerColor) {
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

    makeMove(moveFrom, square);
    setMoveFrom(null);
    setOptionSquares({});
  };

  const handleSquareClick = (square: Square) => {
    if (isGameOver || isBotThinking || isAnimating) return;
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

  const calculateSquarePosition = (square: Square): { x: number; y: number } => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, ..., 1=7
    // Flip coordinates if player is black
    const x = playerColor === "w" ? file : 7 - file;
    const y = playerColor === "w" ? rank : 7 - rank;
    return { x, y };
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

        const isCaptured = capturedSquare === square;
        const isMovingFrom = movingPiece?.from === square;

        squares.push(
          <button
            key={square}
            draggable={!!piece && piece.color === playerColor && !isAnimating && !isGameOver && !isBotThinking}
            onDragStart={(e) => handleDragStart(square, e)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(square, e)}
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
      {/* Game Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-bold flex items-center justify-center gap-2 animate-fade-in">
              {gameResult === "win" && (
                <>
                  <Trophy className="w-8 h-8 text-yellow-500 animate-bounce" />
                  <span className="text-green-500">Victory!</span>
                </>
              )}
              {gameResult === "loss" && (
                <>
                  <X className="w-8 h-8 text-red-500" />
                  <span className="text-red-500">Defeat</span>
                </>
              )}
              {gameResult === "draw" && (
                <span className="text-muted-foreground">Draw</span>
              )}
            </DialogTitle>
            <DialogDescription className="text-center text-lg animate-fade-in animation-delay-200">
              {gameResult === "win" && "Congratulations! You've won the match! 🎉"}
              {gameResult === "loss" && "Better luck next time! Keep practicing! 💪"}
              {gameResult === "draw" && "Well played! The game ended in a draw."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4 animate-scale-in animation-delay-300">
            <Button onClick={() => navigate("/")} className="w-full">
              Back to Home
            </Button>
            <Button onClick={() => navigate("/leaderboards")} variant="outline" className="w-full">
              View Leaderboards
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                      <div className="w-8 h-8 flex items-center justify-center text-2xl">
                        {BlackAvatar}
                      </div>
                    )}
                    {!BlackAvatar && (playerColor === 'w' ? gameData.black_player_type === 'guest' : isGuest) && (
                      <div className="w-8 h-8 flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                    <span className="font-bold">{gameData.black_username}</span>
                    {(playerColor === 'w' ? gameData.black_player_type === 'guest' : isGuest) && (
                      <Badge variant="secondary" className="text-xs">Guest</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className={`font-mono ${blackTime < 60 ? "text-destructive" : ""}`}>
                      {formatTime(blackTime)}
                    </span>
                  </div>
                </div>
                
                {/* Captured pieces by black player */}
                <div className="flex items-center gap-1 flex-wrap min-h-[24px] mt-2">
                  {capturedByBlack.map((piece, index) => (
                    <span key={index} className="text-lg">
                      {getPieceSymbol(piece, 'w')}
                    </span>
                  ))}
                </div>
              </Card>

              <div 
                className="grid grid-cols-8 border-4 border-border rounded-lg overflow-hidden shadow-glow max-w-[600px] mx-auto relative"
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
                              ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))' 
                              : 'drop-shadow(0 3px 6px rgba(255,255,255,0.4))',
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

              <Card className="p-4 mt-4 bg-gradient-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {WhiteAvatar && (
                      <div className="w-8 h-8 flex items-center justify-center text-2xl">
                        {WhiteAvatar}
                      </div>
                    )}
                    {!WhiteAvatar && (playerColor === 'b' ? gameData.white_player_type === 'guest' : isGuest) && (
                      <div className="w-8 h-8 flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                    <span className="font-bold">{gameData.white_username}</span>
                    {(playerColor === 'b' ? gameData.white_player_type === 'guest' : isGuest) && (
                      <Badge variant="secondary" className="text-xs">Guest</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className={`font-mono ${whiteTime < 60 ? "text-destructive" : ""}`}>
                      {formatTime(whiteTime)}
                    </span>
                  </div>
                </div>
                
                {/* Captured pieces by white player */}
                <div className="flex items-center gap-1 flex-wrap min-h-[24px] mt-2">
                  {capturedByWhite.map((piece, index) => (
                    <span key={index} className="text-lg">
                      {getPieceSymbol(piece, 'b')}
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-6 bg-gradient-card">
                <h3 className="font-bold mb-4">Game Info</h3>
                {isGuest && (
                  <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                    <p className="text-muted-foreground">
                      🎮 Playing as guest. This game won't affect ratings.
                    </p>
                  </div>
                )}
                {!isGuest && (
                  <div className="mb-4">
                    <VoiceChat gameId={gameId || ""} userId={userId} />
                  </div>
                )}
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
                  {afkWarning && game.turn() === playerColor && !isGameOver && (
                    <Badge variant="destructive" className="animate-pulse w-full justify-center">
                      ⚠️ Make a move! Auto-resign in {Math.max(0, 180 - Math.floor((new Date().getTime() - lastMoveTime.getTime()) / 1000))}s
                    </Badge>
                  )}
                  {!isGameOver && (
                    <div className="space-y-2 mt-4">
                      <Button
                        onClick={handleResign}
                        variant="destructive"
                        className="w-full"
                        disabled={isAnimating || isBotThinking}
                      >
                        Resign Game
                      </Button>
                      
                      {!isPlayingBot && (
                        <Button
                          onClick={handleOfferDraw}
                          variant="outline"
                          className="w-full"
                          disabled={isAnimating || isBotThinking}
                        >
                          Offer Draw
                        </Button>
                      )}
                    </div>
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
              
              <GameChat 
                gameId={gameId || ""} 
                userId={userId} 
                username={username}
              />
            </div>
          </div>
        </div>

        {/* Draw Offer Dialog */}
        <Dialog open={showDrawDialog} onOpenChange={setShowDrawDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Draw Offer</DialogTitle>
              <DialogDescription>
                Your opponent has offered a draw. Do you accept?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleAcceptDraw} className="flex-1">
                Accept Draw
              </Button>
              <Button onClick={handleDeclineDraw} variant="outline" className="flex-1">
                Decline
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}