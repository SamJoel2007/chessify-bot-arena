import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Send, Loader2, Trash2, Gamepad2, MessageSquare } from "lucide-react";
import { Chess, Square } from "chess.js";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const EXAMPLE_QUESTIONS = [
  "Teach me about controlling the center",
  "What's the best opening for beginners?",
  "How do I improve my tactical vision?",
  "Explain how knights move",
];

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "play">("chat");
  
  // Game state
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameMessages, setGameMessages] = useState<Message[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [movingPiece, setMovingPiece] = useState<{
    from: Square;
    to: Square;
    piece: string;
  } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadConversation();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to access AI Coach");
      navigate("/auth");
    }
  };

  const loadConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("coach_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading conversation:", error);
        return;
      }

      if (data) {
        setConversationId(data.id);
        setMessages((data.messages as any) || []);
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from("coach_conversations")
          .insert({ user_id: user.id, messages: [] })
          .select()
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
        } else {
          setConversationId(newConv.id);
        }
      }
    } catch (error) {
      console.error("Error in loadConversation:", error);
    }
  };

  const saveConversation = async (updatedMessages: Message[]) => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from("coach_conversations")
        .update({ messages: updatedMessages as any })
        .eq("id", conversationId);

      if (error) {
        console.error("Error saving conversation:", error);
      }
    } catch (error) {
      console.error("Error in saveConversation:", error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chess-coach`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast.error("ChessMentor is busy right now, please try again in a moment.");
        } else if (response.status === 402) {
          toast.error("AI Coach usage limit reached. Please try again later.");
        } else {
          toast.error("Failed to get response from AI Coach");
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant") {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMsg, content: assistantContent },
                  ];
                }
                return [
                  ...prev,
                  {
                    role: "assistant",
                    content: assistantContent,
                    timestamp: new Date().toISOString(),
                  },
                ];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      const finalMessages = [
        ...updatedMessages,
        {
          role: "assistant" as const,
          content: assistantContent,
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    if (!conversationId) return;
    
    try {
      await supabase
        .from("coach_conversations")
        .update({ messages: [] })
        .eq("id", conversationId);
      
      setMessages([]);
      toast.success("Conversation cleared");
    } catch (error) {
      console.error("Error clearing conversation:", error);
      toast.error("Failed to clear conversation");
    }
  };

  const startNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setGamePosition(newGame.fen());
    setIsPlayerTurn(true);
    setGameMessages([
      {
        role: "assistant",
        content: "Welcome to our practice game! I'm here to teach you as we play. You'll be playing as White. Remember the key principles: control the center, develop your pieces, and castle early for king safety. Make your first move! ♟️",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const getCoachAnalysis = async (fen: string, lastMove: string, isPlayerMove: boolean) => {
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chess-coach`;
      const { data: { session } } = await supabase.auth.getSession();

      const analysisPrompt = isPlayerMove
        ? `I just played ${lastMove}. The current position is: ${fen}. Please analyze my move, explain if it was good or if there was something better, and teach me about the position.`
        : `Please analyze this position: ${fen}. I need you to make the best move for Black and explain your reasoning, teaching me why it's a good move.`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [
            ...gameMessages,
            { role: "user", content: analysisPrompt, timestamp: new Date().toISOString() },
          ],
        }),
      });

      if (!response.ok || !response.body) {
        toast.error("Coach couldn't analyze the position");
        return null;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setGameMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant") {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMsg, content: assistantContent },
                  ];
                }
                return [
                  ...prev,
                  {
                    role: "assistant",
                    content: assistantContent,
                    timestamp: new Date().toISOString(),
                  },
                ];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      return assistantContent;
    } catch (error) {
      console.error("Error getting coach analysis:", error);
      return null;
    }
  };

  const makeCoachMove = async () => {
    setIsLoading(true);
    try {
      // Get coach analysis which will include the move to make
      const analysis = await getCoachAnalysis(game.fen(), "", false);
      
      if (!analysis) {
        setIsLoading(false);
        return;
      }

      // Extract move from analysis (look for chess notation patterns)
      const moveMatch = analysis.match(/\b([a-h][1-8][a-h][1-8][qrbn]?|[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8]|O-O-O|O-O)\b/);
      
      if (moveMatch) {
        const moveNotation = moveMatch[0];
        try {
          const move = game.move(moveNotation);
          if (move) {
            setGamePosition(game.fen());
            setIsPlayerTurn(true);
            
            if (game.isGameOver()) {
              handleGameOver();
            }
          }
        } catch {
          // If move parsing fails, make a random legal move
          const moves = game.moves();
          if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            game.move(randomMove);
            setGamePosition(game.fen());
            setIsPlayerTurn(true);
          }
        }
      } else {
        // Fallback: make a random legal move
        const moves = game.moves();
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          game.move(randomMove);
          setGamePosition(game.fen());
          setIsPlayerTurn(true);
        }
      }
    } catch (error) {
      console.error("Error making coach move:", error);
      toast.error("Coach couldn't make a move");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameOver = () => {
    let result = "";
    if (game.isCheckmate()) {
      result = game.turn() === "w" ? "Black wins by checkmate!" : "White wins by checkmate!";
    } else if (game.isDraw()) {
      result = "Game drawn!";
    } else if (game.isStalemate()) {
      result = "Game drawn by stalemate!";
    }
    
    setGameMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `${result} Great game! Would you like to discuss what we learned or start a new game?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const animateMove = (from: Square, to: Square, piece: string): Promise<void> => {
    return new Promise((resolve) => {
      setMovingPiece({ from, to, piece });
      setTimeout(() => {
        setMovingPiece(null);
        setLastMove({ from, to });
        resolve();
      }, 300);
    });
  };

  const handleSquareClick = async (square: Square) => {
    if (!isPlayerTurn || isLoading) return;

    const piece = game.get(square);

    // If no square is selected, select this square if it has a white piece
    if (!selectedSquare) {
      if (piece && piece.color === "w") {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to));
      }
      return;
    }

    // If the same square is clicked, deselect it
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    // Try to make the move
    try {
      const move = game.move({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });

      if (move === null) {
        // If move is invalid, check if clicking on another white piece
        if (piece && piece.color === "w") {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          setPossibleMoves(moves.map((m) => m.to));
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
        return;
      }

      // Animate the move
      const pieceSymbols: Record<string, string> = {
        p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
        P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
      };
      await animateMove(selectedSquare, square, pieceSymbols[move.piece.toUpperCase()]);

      // Move was successful
      setSelectedSquare(null);
      setPossibleMoves([]);
      setGamePosition(game.fen());
      setIsPlayerTurn(false);

      // Add player move to messages
      setGameMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `I played ${move.san}`,
          timestamp: new Date().toISOString(),
        },
      ]);

      if (game.isGameOver()) {
        handleGameOver();
        return;
      }

      // Get coach analysis of player's move
      await getCoachAnalysis(game.fen(), move.san, true);
      
      // Coach makes its move
      setTimeout(() => {
        makeCoachMove();
      }, 1000);
    } catch (error) {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const getSquareCoordinates = (square: Square) => {
    const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const rank = 8 - parseInt(square[1]); // '8' = 0, '7' = 1, etc.
    return { file, rank };
  };

  const renderBoard = () => {
    const board = game.board();
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

    const pieceSymbols: Record<string, string> = {
      p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
      P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
    };

    return (
      <div className="relative">
        <div className="grid grid-cols-8 aspect-square w-full max-w-[500px] border-4 border-border rounded-lg overflow-hidden shadow-lg">
          {ranks.map((rank, rankIndex) =>
            files.map((file, fileIndex) => {
              const square = `${file}${rank}` as Square;
              const piece = board[rankIndex][fileIndex];
              const isLight = (rankIndex + fileIndex) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isPossibleMove = possibleMoves.includes(square);
              const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
              const isMovingFrom = movingPiece?.from === square;

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`
                    relative flex items-center justify-center cursor-pointer
                    transition-all duration-200 hover:brightness-110
                    ${isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]"}
                    ${isSelected ? "ring-4 ring-primary ring-inset animate-pulse" : ""}
                    ${isLastMoveSquare ? "bg-yellow-400/30" : ""}
                    ${isPossibleMove ? "after:content-[''] after:absolute after:w-4 after:h-4 after:rounded-full after:bg-primary/50 after:shadow-lg" : ""}
                  `}
                >
                  {piece && !isMovingFrom && (
                    <span 
                      className={`
                        text-5xl select-none transition-transform duration-200 hover:scale-110
                        ${piece.color === "w" 
                          ? "text-gray-100 drop-shadow-[0_0_3px_rgba(0,0,0,0.9)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]" 
                          : "text-gray-900 drop-shadow-[0_0_3px_rgba(255,255,255,0.9)] [text-shadow:_-1px_-1px_0_#fff,_1px_-1px_0_#fff,_-1px_1px_0_#fff,_1px_1px_0_#fff]"
                        }
                      `}
                    >
                      {pieceSymbols[piece.type.toUpperCase()]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Moving piece overlay */}
        {movingPiece && (
          <div
            className="absolute pointer-events-none z-50 text-5xl select-none transition-all duration-300 ease-out"
            style={{
              left: `${(getSquareCoordinates(movingPiece.to).file / 8) * 100}%`,
              top: `${(getSquareCoordinates(movingPiece.to).rank / 8) * 100}%`,
              width: '12.5%',
              height: '12.5%',
              transform: 'translate(0, 0)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-100 drop-shadow-[0_0_3px_rgba(0,0,0,0.9)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000] animate-pulse">
                {movingPiece.piece}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <Card className="mb-4 p-6 border-primary/20 bg-card/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  ChessMentor <span className="text-xl">♟️</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your personal AI chess coach
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "chat" && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearConversation}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {activeTab === "play" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewGame}
                  className="gap-2"
                >
                  <Gamepad2 className="w-4 h-4" />
                  New Game
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "play")} className="flex-1 flex flex-col">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat Mode
            </TabsTrigger>
            <TabsTrigger value="play" className="gap-2">
              <Gamepad2 className="w-4 h-4" />
              Play with Coach
            </TabsTrigger>
          </TabsList>

          {/* Chat Mode */}
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0">

            <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 bg-card/80 backdrop-blur">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="text-center space-y-2">
                  <p className="text-lg text-muted-foreground">
                    Welcome! I'm here to help you improve your chess skills.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about chess or try one of these:
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EXAMPLE_QUESTIONS.map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(question)}
                      className="text-xs"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary text-secondary-foreground rounded-lg p-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">ChessMentor is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage(inputMessage)}
                placeholder="Ask me anything about chess..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage(inputMessage)}
                disabled={isLoading || !inputMessage.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
              </div>
            </Card>
          </TabsContent>

          {/* Play Mode */}
          <TabsContent value="play" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 grid md:grid-cols-2 gap-4">
              {/* Chess Board */}
              <Card className="p-4 border-primary/20 bg-card/80 backdrop-blur flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  {renderBoard()}
                </div>
                <div className="mt-4 text-center">
                  {isPlayerTurn ? (
                    <p className="text-sm text-muted-foreground">Your turn (White)</p>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Coach is thinking...</p>
                    </div>
                  )}
                  {game.isCheck() && <p className="text-sm text-destructive font-bold mt-2">Check!</p>}
                </div>
              </Card>

              {/* Coach Commentary */}
              <Card className="p-4 border-primary/20 bg-card/80 backdrop-blur flex flex-col overflow-hidden">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Coach Commentary
                </h3>
                <ScrollArea className="flex-1" ref={scrollRef}>
                  {gameMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
                      <p className="text-muted-foreground">
                        Start a new game to play with your coach and receive real-time teaching and feedback!
                      </p>
                      <Button onClick={startNewGame} className="gap-2">
                        <Gamepad2 className="w-4 h-4" />
                        Start Game
                      </Button>
                    </div>
                  ) : (
                    <div className="pr-4">
                      {(() => {
                        const latestCoachMessage = gameMessages
                          .filter(msg => msg.role === "assistant")
                          .slice(-1)[0];
                        
                        return latestCoachMessage ? (
                          <div className="animate-fade-in rounded-lg p-4 bg-secondary/50 border-l-4 border-secondary">
                            <p className="text-sm font-semibold mb-2 text-muted-foreground">Coach</p>
                            <p className="whitespace-pre-wrap break-words">{latestCoachMessage.content}</p>
                            <p className="text-xs opacity-70 mt-2">
                              {new Date(latestCoachMessage.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center">
                            Coach will provide feedback here as you play
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
