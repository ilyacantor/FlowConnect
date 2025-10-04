import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Route, Users, X, Heart } from "lucide-react";
import type { User } from "@shared/schema";

interface BuddyMatchCardProps {
  user: User;
  onMatch: () => void;
  onPass: () => void;
}

export default function BuddyMatchCard({ user, onMatch, onPass }: BuddyMatchCardProps) {
  const preferences = user.preferences || ["Road Cycling", "Hill Training", "Coffee Stops"];
  
  return (
    <Card className="w-full max-w-md mx-auto card-shadow-lg overflow-hidden" data-testid={`card-buddy-match-${user.id}`}>
      <div className="relative h-80">
        <img 
          src={user.profileImageUrl || "https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"} 
          alt="Profile" 
          className="w-full h-full object-cover"
          data-testid="img-buddy-photo"
        />
        {user.tier && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="text-white bg-secondary" data-testid="badge-buddy-tier">
              <div className="w-2 h-2 bg-white rounded-full mr-1" />
              {user.tier} Ride
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold" data-testid="text-buddy-name">
              {user.firstName} {user.lastName}
            </h3>
            {user.location && (
              <p className="text-muted-foreground flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                <span data-testid="text-buddy-location">{user.location}</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          {user.weeklyMileage && (
            <div className="flex items-center space-x-2 text-sm">
              <Route className="w-4 h-4 text-muted-foreground" />
              <span data-testid="text-buddy-mileage">Rides {user.weeklyMileage} miles per week</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>Open to group rides</span>
          </div>
          {user.bio && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span data-testid="text-buddy-bio">{user.bio}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.isArray(preferences) ? preferences.map((pref: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-buddy-preference-${index}`}>
              {pref}
            </Badge>
          )) : null}
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            className="flex-1 py-3 font-semibold"
            onClick={onPass}
            data-testid="button-pass"
          >
            <X className="w-4 h-4 mr-2" />
            Pass
          </Button>
          <Button 
            className="flex-1 py-3 font-semibold"
            onClick={onMatch}
            data-testid="button-connect"
          >
            <Heart className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
