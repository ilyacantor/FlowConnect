import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { GroupRide, ActivityPost, User } from "@shared/schema";
import { 
  Calendar, 
  Users, 
  Heart, 
  TrendingUp, 
  MapPin,
  Clock,
  Route,
  Trophy
} from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();

  // Fetch user's upcoming rides
  const { data: upcomingRides = [] } = useQuery<GroupRide[]>({
    queryKey: ["/api/user/rides"],
    enabled: !!user,
  });

  // Fetch activity feed
  const { data: activityFeed = [] } = useQuery<ActivityPost[]>({
    queryKey: ["/api/activity"],
  });

  // Fetch potential matches count
  const { data: potentialMatches = [] } = useQuery<User[]>({
    queryKey: ["/api/matches/potential"],
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const stats = [
    {
      label: "Weekly Miles",
      value: user?.weeklyMileage || "0",
      icon: Route,
      color: "text-secondary"
    },
    {
      label: "Total Rides",
      value: user?.totalRides || "0",
      icon: Calendar,
      color: "text-accent"
    },
    {
      label: "Kudos",
      value: user?.kudosReceived || "0",
      icon: Heart,
      color: "text-primary"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground" data-testid="text-welcome-subtitle">
          Ready for your next ride? Here's what's happening in your cycling community.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="card-shadow" data-testid={`card-stat-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold stat-number" data-testid={`text-stat-value-${index}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-stat-label-${index}`}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityFeed.length > 0 ? (
                <div className="space-y-4">
                  {activityFeed.slice(0, 3).map((post: any) => (
                    <div key={post.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg" data-testid={`activity-post-${post.id}`}>
                      <img
                        src={post.user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                        alt="User"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm" data-testid={`text-activity-author-${post.id}`}>
                            {post.user?.firstName} {post.user?.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground" data-testid={`text-activity-time-${post.id}`}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm" data-testid={`text-activity-content-${post.id}`}>
                          {post.content}
                        </p>
                        {post.rideData && post.rideData.distance && (
                          <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
                            <span>{post.rideData.distance} miles</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-activity">
                  No recent activity. Start following other riders to see their posts!
                </p>
              )}
              <div className="mt-4 text-center">
                <Link href="/activity">
                  <Button variant="outline" size="sm" data-testid="button-view-all-activity">
                    View All Activity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/buddy-match">
                <Button className="w-full justify-start" variant="outline" data-testid="button-buddy-match">
                  <Heart className="w-4 h-4 mr-2" />
                  Find Riding Buddies
                  {potentialMatches.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {potentialMatches.length}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/group-rides">
                <Button className="w-full justify-start" variant="outline" data-testid="button-group-rides">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Group Rides
                </Button>
              </Link>
              <Link href="/profile">
                <Button className="w-full justify-start" variant="outline" data-testid="button-profile">
                  <Trophy className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Rides */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Upcoming Rides</span>
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
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span data-testid={`text-ride-date-${ride.id}`}>
                            {new Date(ride.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span data-testid={`text-ride-location-${ride.id}`}>{ride.location}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-2" data-testid={`badge-ride-tier-${ride.id}`}>
                        {ride.tier} Tier
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm" data-testid="text-no-upcoming-rides">
                  No upcoming rides. Browse group rides to join one!
                </p>
              )}
              <div className="mt-4">
                <Link href="/group-rides">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-find-rides">
                    Find More Rides
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tier Recommendation */}
          {user?.tier && (
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Your Ability Match</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge variant="secondary" className="mb-3" data-testid="badge-user-tier">
                    {user.tier} Tier Rider
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on your FTP and training profile
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-accent/10 rounded-lg">
                      <span>{user.tier}-tier social rides</span>
                      <Badge variant="outline" className="text-accent">Perfect Fit</Badge>
                    </div>
                    {user.tier === "B" && (
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span>A-tier flat routes</span>
                        <Badge variant="outline" className="text-secondary">Try It</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
