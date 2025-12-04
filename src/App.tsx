import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Bots from "./pages/Bots";
import Game from "./pages/Game";
import Puzzles from "./pages/Puzzles";
import PuzzleGame from "./pages/PuzzleGame";
import PurchaseCoins from "./pages/PurchaseCoins";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminEvent from "./pages/AdminEvent";
import AdminTournaments from "./pages/AdminTournaments";
import AdminSEO from "./pages/AdminSEO";
import OnlineGame from "./pages/OnlineGame";
import Messages from "./pages/Messages";
import Friends from "./pages/Friends";
import Notifications from "./pages/Notifications";
import MyProfile from "./pages/MyProfile";
import Leaderboards from "./pages/Leaderboards";
import Certificates from "./pages/Certificates";
import VictoryShowcase from "./pages/VictoryShowcase";
import Coach from "./pages/Coach";
import Community from "./pages/Community";
import TournamentRegistration from "./pages/TournamentRegistration";
import TournamentLobby from "./pages/TournamentLobby";
import JoinGame from "./pages/JoinGame";
import GameLobby from "./pages/GameLobby";
import Feed from "./pages/Feed";
import GameHistory from "./pages/GameHistory";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/bots" element={<Bots />} />
          <Route path="/game" element={<Game />} />
          <Route path="/puzzles" element={<Puzzles />} />
          <Route path="/puzzle-game" element={<PuzzleGame />} />
          <Route path="/purchase-coins" element={<PurchaseCoins />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/event" element={<AdminEvent />} />
          <Route path="/admin/tournaments" element={<AdminTournaments />} />
          <Route path="/admin/seo" element={<AdminSEO />} />
          <Route path="/online-game/:gameId" element={<OnlineGame />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/victory-showcase" element={<VictoryShowcase />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/community" element={<Community />} />
          <Route path="/tournament/:slug" element={<TournamentRegistration />} />
          <Route path="/tournament/:slug/lobby" element={<TournamentLobby />} />
          <Route path="/join/:inviteCode" element={<JoinGame />} />
          <Route path="/lobby/:inviteCode" element={<GameLobby />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/game-history" element={<GameHistory />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
