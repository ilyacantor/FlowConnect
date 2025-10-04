import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RideCard from "@/components/ride-card";
import type { GroupRide } from "@shared/schema";
import { Lightbulb, SlidersHorizontal, Plus } from "lucide-react";

export default function GroupRides() {
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    if (tierFilter && tierFilter !== "all") {
      params.append("tier", tierFilter);
    }
    if (dayFilter && dayFilter !== "all") {
      params.append("date", dayFilter);
    }
    const queryString = params.toString();
    return `/api/rides${queryString ? `?${queryString}` : ""}`;
  };

  const { data: rides = [], isLoading, error } = useQuery<GroupRide[]>({
    queryKey: [buildQueryUrl()],
  });

  const joinRideMutation = useMutation({
    mutationFn: async (rideId: string) => {
      return await apiRequest("POST", `/api/rides/${rideId}/join`, {});
    },
    onSuccess: (_, rideId) => {
      toast({
        title: "Joined ride!",
        description: "You've successfully joined this group ride. See you there!",
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          !!(query.queryKey[0] && 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/rides'))
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/rides"] });
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
        title: "Failed to join ride",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRecommendationText = () => {
    if (!user?.tier) {
      return "We don't have your FTP yet. Connect Garmin or TrainingPeaks.";
    }
    
    const tier = user.tier;
    
    if (tier === "A") {
      return "You're in A rides. Coffee rides on B pace for easy days.";
    } else if (tier === "B") {
      return "B rides with regroups are your pace. A rides work on flatter routes.";
    } else {
      return "C rides are your zone. No-drop pace builds confidence.";
    }
  };

  if (error && !isUnauthorizedError(error)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription data-testid="text-error">
            Failed to load group rides. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-page-title">Group Rides</h1>
          <p className="text-lg text-muted-foreground" data-testid="text-page-description">
            Find riders at your pace
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-40" data-testid="select-tier-filter">
              <SelectValue placeholder="All Rides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rides</SelectItem>
              <SelectItem value="A">A Ride</SelectItem>
              <SelectItem value="B">B Ride</SelectItem>
              <SelectItem value="C">C Ride</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="w-40" data-testid="select-day-filter">
              <SelectValue placeholder="All Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              <SelectItem value="weekdays">Weekdays</SelectItem>
              <SelectItem value="weekends">Weekends</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" data-testid="button-more-filters">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>
      
      {/* AI Recommendation */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 flex items-center" data-testid="text-recommendation-title">
                  Recommended for You
                  <Badge variant="outline" className="ml-2 text-xs bg-accent/20 text-accent-foreground border-accent/20">
                    Smart Match
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-recommendation-description">
                  {getRecommendationText()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Rides Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-muted rounded-xl h-64"></div>
            </div>
          ))}
        </div>
      ) : rides.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2" data-testid="text-no-rides">No rides found</h3>
          <p className="text-muted-foreground mb-4" data-testid="text-no-rides-description">
            {(tierFilter !== "all" || dayFilter !== "all")
              ? "Looks like no-drop rides aren't posted this weekend."
              : "No Saturday rides posted yet — check back Friday evening."
            }
          </p>
          <Button variant="outline" onClick={() => {
            setTierFilter("all");
            setDayFilter("all");
          }} data-testid="button-clear-filters">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onJoin={() => joinRideMutation.mutate(ride.id)}
              isJoining={joinRideMutation.isPending}
            />
          ))}
        </div>
      )}
      
      {rides.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" data-testid="button-load-more">
            Load More Rides
          </Button>
        </div>
      )}
    </div>
  );
}
