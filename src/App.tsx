import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import OnlineGame from "./pages/OnlineGame";
import Messages from "./pages/Messages";
import Friends from "./pages/Friends";
import Notifications from "./pages/Notifications";
import MyProfile from "./pages/MyProfile";
import Leaderboards from "./pages/Leaderboards";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/online-game/:gameId" element={<OnlineGame />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
