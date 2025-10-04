import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ActivityPost from "@/components/activity-post";
import type { ActivityPost as ActivityPostType } from "@shared/schema";
import { 
  Plus, 
  Filter, 
  TrendingUp, 
  Calendar, 
  Trophy,
  Users,
  Award
} from "lucide-react";

const newPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(1000, "Content too long"),
  rideData: z.object({
    distance: z.number().optional(),
    elevation: z.number().optional(),
    time: z.string().optional(),
  }).optional(),
});

type NewPostFormData = z.infer<typeof newPostSchema>;

export default function ActivityFeed() {
  const [showNewPost, setShowNewPost] = useState(false);
  const [kudosState, setKudosState] = useState<Record<string, boolean>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NewPostFormData>({
    resolver: zodResolver(newPostSchema),
    defaultValues: {
      content: "",
      rideData: {
        distance: undefined,
        elevation: undefined,
        time: "",
      },
    },
  });

  // Fetch activity feed
  const { data: activityFeed = [], isLoading, error } = useQuery<(ActivityPostType & {
    user?: {
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  })[]>({
    queryKey: ["/api/activity"],
  });

  // Fetch user's upcoming rides for sidebar
  const { data: upcomingRides = [] } = useQuery<import("@shared/schema").GroupRide[]>({
    queryKey: ["/api/user/rides"],
    enabled: !!user,
  });

  // Create new post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: NewPostFormData) => {
      return await apiRequest("POST", "/api/activity", data);
    },
    onSuccess: () => {
      toast({
        title: "Post created",
        description: "Your activity post has been shared with the community!",
      });
      form.reset();
      setShowNewPost(false);
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
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
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle kudos mutation
  const kudosMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("POST", `/api/activity/${postId}/kudos`, {});
      return await response.json();
    },
    onSuccess: (data, postId) => {
      setKudosState(prev => ({ ...prev, [postId]: data.kudos }));
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
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

  const onSubmit = (data: NewPostFormData) => {
    createPostMutation.mutate(data);
  };

  const handleKudos = (postId: string) => {
    kudosMutation.mutate(postId);
  };

  if (error && !isUnauthorizedError(error)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription data-testid="text-error">
            Failed to load activity feed. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Activity Feed</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" data-testid="button-filter">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          {user && (
            <Button 
              onClick={() => setShowNewPost(!showNewPost)}
              data-testid="button-new-post"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Post Form */}
          {showNewPost && user && (
            <Card className="card-shadow" data-testid="card-new-post">
              <CardHeader>
                <CardTitle>Share Your Ride</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Share your latest ride, achievement, or cycling thoughts..."
                              rows={3}
                              data-testid="textarea-post-content"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="rideData.distance"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                {...field}
                                type="number"
                                step="0.1"
                                placeholder="Distance (miles)"
                                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                data-testid="input-distance"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rideData.elevation"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                {...field}
                                type="number"
                                placeholder="Elevation (ft)"
                                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                data-testid="input-elevation"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rideData.time"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                {...field}
                                type="text"
                                placeholder="Time (e.g., 2:15)"
                                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                                data-testid="input-time"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowNewPost(false)}
                        data-testid="button-cancel-post"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPostMutation.isPending}
                        data-testid="button-submit-post"
                      >
                        {createPostMutation.isPending ? "Posting..." : "Share Post"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Activity Posts */}
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <Card className="card-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/4"></div>
                          <div className="h-3 bg-muted rounded w-1/6"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                      <div className="h-48 bg-muted rounded-lg mb-4"></div>
                      <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="text-center">
                            <div className="h-6 bg-muted rounded mb-1"></div>
                            <div className="h-3 bg-muted rounded"></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : activityFeed.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-no-posts">No posts yet</h3>
              <p className="text-muted-foreground mb-4" data-testid="text-no-posts-description">
                Be the first to share your cycling journey with the community!
              </p>
              {user && (
                <Button onClick={() => setShowNewPost(true)} data-testid="button-create-first-post">
                  Create Your First Post
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {activityFeed.map((post) => (
                <ActivityPost
                  key={post.id}
                  post={post}
                  onKudos={() => handleKudos(post.id)}
                  isKudosActive={kudosState[post.id]}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tier Recommendation Card */}
          {user?.tier && (
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Your Ability Match</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current Tier</span>
                      <Badge variant="secondary" data-testid="badge-current-tier">
                        {user.tier} Tier
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on your FTP and training profile
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-3">Recommended Rides</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="text-sm">{user.tier}-tier social rides</span>
                        <Badge variant="outline" className="text-xs text-accent">Perfect Fit</Badge>
                      </div>
                      {user.tier === "B" && (
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <span className="text-sm">A-tier flat routes</span>
                          <Badge variant="outline" className="text-xs text-secondary">Try It</Badge>
                        </div>
                      )}
                      {user.tier === "A" && (
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <span className="text-sm">B-tier recovery rides</span>
                          <Badge variant="outline" className="text-xs text-muted-foreground">Easy Day</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Upcoming Rides */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Your Upcoming Rides</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRides.length > 0 ? (
                <div className="space-y-3">
                  {upcomingRides.slice(0, 3).map((ride: any) => (
                    <div key={ride.id} className="p-3 bg-muted/50 rounded-lg" data-testid={`upcoming-ride-${ride.id}`}>
                      <div className="font-medium mb-1" data-testid={`text-ride-name-${ride.id}`}>
                        {ride.name}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-ride-date-${ride.id}`}>
                        {new Date(ride.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm" data-testid="text-no-upcoming-rides">
                  No upcoming rides. Browse group rides to join one!
                </p>
              )}
              <Button variant="outline" size="sm" className="w-full mt-4" data-testid="button-view-all-rides">
                View All Rides
              </Button>
            </CardContent>
          </Card>
          
          {/* Achievements This Week */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span>This Week's Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3" data-testid="achievement-streak">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">7 Day Streak</div>
                    <div className="text-xs text-muted-foreground">Keep it going!</div>
                  </div>
                </div>
                {user?.weeklyMileage && user.weeklyMileage >= 100 && (
                  <div className="flex items-center space-x-3" data-testid="achievement-mileage">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">100+ Miles This Week</div>
                      <div className="text-xs text-muted-foreground">Personal best!</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
