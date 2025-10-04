import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import type { ActivityPost } from "@shared/schema";

interface ActivityPostProps {
  post: ActivityPost & {
    user?: {
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  };
  onKudos?: () => void;
  onComment?: () => void;
  isKudosActive?: boolean;
}

export default function ActivityPost({ post, onKudos, onComment, isKudosActive }: ActivityPostProps) {
  const [imageError, setImageError] = useState(false);
  
  const rideData = post.rideData as any;
  
  return (
    <Card className="card-shadow" data-testid={`card-activity-post-${post.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <img
            src={post.user?.profileImageUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"}
            alt="User avatar"
            className="w-12 h-12 rounded-full object-cover"
            data-testid="img-post-avatar"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold" data-testid="text-post-author">
                  {post.user?.firstName} {post.user?.lastName}
                </h4>
                <p className="text-sm text-muted-foreground" data-testid="text-post-timestamp">
                  {post.createdAt && new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <Button variant="ghost" size="sm" data-testid="button-post-menu">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            {post.content && (
              <p className="mt-3 text-foreground" data-testid="text-post-content">
                {post.content}
              </p>
            )}
          </div>
        </div>
        
        {post.imageUrl && !imageError && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={post.imageUrl}
              alt="Ride photo"
              className="w-full object-cover max-h-96"
              onError={() => setImageError(true)}
              data-testid="img-post-photo"
            />
          </div>
        )}
        
        {rideData && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg mb-4" data-testid="card-ride-stats">
            {rideData.distance && (
              <div className="text-center">
                <div className="text-lg font-bold stat-number" data-testid="text-stat-distance">
                  {rideData.distance}
                </div>
                <div className="text-xs text-muted-foreground">miles</div>
              </div>
            )}
            {rideData.elevation && (
              <div className="text-center">
                <div className="text-lg font-bold stat-number" data-testid="text-stat-elevation">
                  {rideData.elevation.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">ft gain</div>
              </div>
            )}
            {rideData.time && (
              <div className="text-center">
                <div className="text-lg font-bold stat-number" data-testid="text-stat-time">
                  {rideData.time}
                </div>
                <div className="text-xs text-muted-foreground">hours</div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onKudos}
            className={`transition-colors ${isKudosActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            data-testid="button-kudos"
          >
            <Heart className={`w-4 h-4 mr-2 ${isKudosActive ? "fill-current" : ""}`} />
            <span className="font-medium">{post.kudosCount || 0} Kudos</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onComment}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-comments"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            <span>{post.commentsCount || 0} Comments</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-share"
          >
            <Share className="w-4 h-4 mr-2" />
            <span>Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
