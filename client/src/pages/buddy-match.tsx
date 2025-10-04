import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import BuddyMatchCard from "@/components/buddy-match-card";
import type { User } from "@shared/schema";
import { Heart, Users, Bot, ArrowRight, RefreshCw, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function BuddyMatch() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: potentialMatches = [], isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["/api/matches/potential"],
    retry: false,
  });

  const matchMutation = useMutation({
    mutationFn: async ({ targetUserId, decision }: { targetUserId: string; decision: "like" | "pass" }) => {
      const response = await apiRequest("POST", `/api/matches/${targetUserId}/${decision}`, {});
      return await response.json();
    },
    onSuccess: (data, variables) => {
      if (variables.decision === "like" && data.isMatch) {
        toast({
          title: "It's a match! 🎉",
          description: "You both liked each other. Start planning your next ride together!",
        });
      }
      setCurrentIndex(prev => prev + 1);
      
      // Refetch potential matches if we're running low
      if (currentIndex >= potentialMatches.length - 2) {
        queryClient.invalidateQueries({ queryKey: ["/api/matches/potential"] });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMatch = () => {
    const currentUser = potentialMatches[currentIndex];
    if (currentUser) {
      matchMutation.mutate({ targetUserId: currentUser.id, decision: "like" });
    }
  };

  const handlePass = () => {
    const currentUser = potentialMatches[currentIndex];
    if (currentUser) {
      matchMutation.mutate({ targetUserId: currentUser.id, decision: "pass" });
    }
  };

  if (error && !isUnauthorizedError(error)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription data-testid="text-error">
            Failed to load potential matches. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-page-title">BuddyMatch</h1>
        <p className="text-lg text-muted-foreground mb-4" data-testid="text-page-description">
          Find riders at your pace
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link href="/buddy-preferences">
            <Button variant="outline" size="sm" data-testid="button-buddy-preferences">
              <Settings className="w-4 h-4 mr-2" />
              My Preferences
            </Button>
          </Link>
          <Link href="/buddy-finder">
            <Button variant="outline" size="sm" data-testid="button-buddy-finder">
              <Search className="w-4 h-4 mr-2" />
              Browse All Riders
            </Button>
          </Link>
        </div>
      </div>
      
      {/* AI Concierge Suggestion */}
      <div className="max-w-2xl mx-auto mb-8">
        <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 flex items-center" data-testid="text-concierge-title">
                  Race Prep Buddies Near You
                  <Badge variant="secondary" className="ml-2 text-xs">Smart Match</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mb-3" data-testid="text-concierge-description">
                  3 riders near you are also building for weekend gravel rides
                </p>
                <button className="text-sm text-secondary font-medium hover:underline flex items-center">
                  View Training Block <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Card Stack */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-md" style={{ height: "600px" }}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : potentialMatches.length === 0 ? (
            <Card className="absolute inset-0 flex items-center justify-center card-shadow">
              <CardContent className="text-center p-8">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-no-matches">
                  No matches found
                </h3>
                <p className="text-muted-foreground mb-4" data-testid="text-no-matches-description">
                  Try widening your FTP range or pace band.
                </p>
                <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : currentIndex >= potentialMatches.length ? (
            <Card className="absolute inset-0 flex items-center justify-center card-shadow">
              <CardContent className="text-center p-8">
                <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-end-of-deck">
                  That's everyone for now
                </h3>
                <p className="text-muted-foreground mb-4" data-testid="text-end-of-deck-description">
                  Check back later for more riders in your area.
                </p>
                <Button 
                  onClick={() => {
                    setCurrentIndex(0);
                    refetch();
                  }} 
                  data-testid="button-start-over"
                >
                  Start Over
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Background Cards */}
              {currentIndex + 2 < potentialMatches.length && (
                <div className="absolute inset-0 transform rotate-3 scale-95 opacity-50">
                  <Card className="w-full h-full card-shadow" />
                </div>
              )}
              
              {currentIndex + 1 < potentialMatches.length && (
                <div className="absolute inset-0 transform -rotate-2 scale-97 opacity-75">
                  <Card className="w-full h-full card-shadow" />
                </div>
              )}
              
              {/* Active Card */}
              <div className="absolute inset-0">
                <BuddyMatchCard
                  user={potentialMatches[currentIndex]}
                  onMatch={handleMatch}
                  onPass={handlePass}
                />
              </div>
            </>
          )}
        </div>
        
        {potentialMatches.length > 0 && currentIndex < potentialMatches.length && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground" data-testid="text-matches-remaining">
              <span className="font-semibold text-foreground">
                {potentialMatches.length - currentIndex}
              </span> potential matches remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
