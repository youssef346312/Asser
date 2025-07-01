import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import Verification from "@/pages/Verification";
import Profile from "@/pages/Profile";
import Transactions from "@/pages/Transactions";
import Home from "@/pages/Home";
import Team from "@/pages/Team";
import Admin from "@/pages/Admin";
import AdminPanel from "@/pages/AdminPanel";
import TelegramGames from "@/pages/TelegramGames";
import BottomNavigation from "@/components/BottomNavigation";
import TopHeader from "@/components/TopHeader";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-coins text-white text-2xl loading-spinner"></i>
          </div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/verification" component={Verification} />
        <Route path="/" component={Auth} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="mobile-container">
      <TopHeader />
      <main className="mobile-safe-area">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/profile" component={Profile} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/home" component={Home} />
          <Route path="/team" component={Team} />
          <Route path="/telegram-games" component={TelegramGames} />
          {user?.isAdmin && <Route path="/admin" component={Admin} />}
          {user?.isAdmin && <Route path="/admin-panel" component={AdminPanel} />}
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;