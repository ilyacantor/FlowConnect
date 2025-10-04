import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import BuddyMatch from "@/pages/buddy-match";
import GroupRides from "@/pages/group-rides";
import ActivityFeed from "@/pages/activity-feed";
import MatchDebug from "@/pages/match-debug";
import MatchConsole from "@/pages/match-console";
import BuddyPreferences from "@/pages/buddy-preferences";
import BuddyFinder from "@/pages/buddy-finder";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/home" component={Home} />
            <Route path="/profile" component={Profile} />
            <Route path="/buddy-match" component={BuddyMatch} />
            <Route path="/group-rides" component={GroupRides} />
            <Route path="/activity" component={ActivityFeed} />
            <Route path="/match-debug" component={MatchDebug} />
            <Route path="/match-console" component={MatchConsole} />
            <Route path="/buddy-preferences" component={BuddyPreferences} />
            <Route path="/buddy-finder" component={BuddyFinder} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
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
