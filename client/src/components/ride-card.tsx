import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Route, MapPin, Users, Shield, AlertTriangle } from "lucide-react";
import type { GroupRide } from "@shared/schema";

interface RideCardProps {
  ride: GroupRide;
  onJoin?: () => void;
  isJoining?: boolean;
}

export default function RideCard({ ride, onJoin, isJoining }: RideCardProps) {
  const tierColors = {
    A: "bg-primary/10 text-primary",
    B: "bg-secondary/10 text-secondary", 
    C: "bg-muted text-foreground"
  };

  const tierColor = tierColors[ride.tier] || "bg-muted text-foreground";

  return (
    <Card className="card-shadow hover:card-shadow-lg transition-shadow overflow-hidden" data-testid={`card-ride-${ride.id}`}>
      <div className="relative h-48">
        <img 
          src="https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
          alt="Group ride" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <Badge className={tierColor} data-testid="badge-ride-tier">
              {ride.tier} Tier
            </Badge>
            <div className="text-white text-sm flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span data-testid="text-ride-participants">
                {ride.currentParticipants || 0}/{ride.maxParticipants}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-5">
        <h3 className="text-xl font-bold mb-2" data-testid="text-ride-name">
          {ride.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid="text-ride-description">
          {ride.description}
        </p>
        
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span data-testid="text-ride-date">
              {new Date(ride.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          {ride.distance && (
            <div className="flex items-center text-muted-foreground">
              <Route className="w-4 h-4 mr-2 flex-shrink-0" />
              <span data-testid="text-ride-distance">{ride.distance} miles</span>
            </div>
          )}
          {ride.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span data-testid="text-ride-location">{ride.location}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          {ride.isNoDrop && (
            <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20" data-testid="badge-no-drop">
              <Shield className="w-3 h-3 mr-1" />
              No-Drop
            </Badge>
          )}
          {!ride.isNoDrop && (
            <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20" data-testid="badge-drop-ride">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Drop Ride
            </Badge>
          )}
          {ride.hasRegroups && (
            <Badge variant="outline" className="text-xs" data-testid="badge-regroups">
              Regroups
            </Badge>
          )}
          {ride.tags && Array.isArray(ride.tags) && (ride.tags as string[]).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-tag-${index}`}>
              {tag}
            </Badge>
          ))}
        </div>
        
        {onJoin && (
          <Button 
            className="w-full font-semibold" 
            onClick={onJoin}
            disabled={isJoining || (ride.maxParticipants !== null && ride.currentParticipants !== null && ride.currentParticipants >= ride.maxParticipants)}
            data-testid="button-join-ride"
          >
            {isJoining 
              ? "Joining..." 
              : (ride.maxParticipants !== null && ride.currentParticipants !== null && ride.currentParticipants >= ride.maxParticipants)
                ? "Ride Full"
                : "Join Ride"
            }
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
