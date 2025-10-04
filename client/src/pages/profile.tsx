import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Edit, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Heart,
  Route,
  Users,
  Mountain,
  Coffee,
  Award
} from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  location: z.string().optional(),
  bio: z.string().optional(),
  weeklyMileage: z.string().optional(),
  ftpWatts: z.string().optional(),
  tier: z.enum(["A", "B", "C"]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      location: user?.location || "",
      bio: user?.bio || "",
      weeklyMileage: user?.weeklyMileage?.toString() || "",
      ftpWatts: user?.ftpWatts?.toString() || "",
      tier: user?.tier || undefined,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const updateData = {
        ...data,
        weeklyMileage: data.weeklyMileage ? parseInt(data.weeklyMileage) : null,
        ftpWatts: data.ftpWatts ? parseInt(data.ftpWatts) : null,
      };
      return await apiRequest("PATCH", "/api/profile", updateData);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const achievements = (Array.isArray(user?.achievements) && user.achievements.length > 0) 
    ? user.achievements 
    : [
        { name: "Century Rider", icon: Trophy, color: "text-accent" },
        { name: "Group Leader", icon: Users, color: "text-secondary" },
        { name: "30 Day Streak", icon: Calendar, color: "text-primary" },
        { name: "Early Adopter", icon: Award, color: "text-muted-foreground" },
        { name: "Route Explorer", icon: Route, color: "text-muted-foreground" },
      ];

  const preferences = [
    "Road Cycling",
    "Weekend Warrior", 
    "Social Rides",
    "Hill Climbing",
    "Metric Century"
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl card-shadow-lg overflow-hidden mb-8">
        <div className="relative h-48 bg-gradient-to-br from-secondary to-primary">
          <div className="absolute -bottom-16 left-8">
            <img 
              src={user?.profileImageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
              alt="Profile" 
              className="w-32 h-32 rounded-full border-4 border-card object-cover"
              data-testid="img-profile"
            />
          </div>
        </div>
        
        <div className="pt-20 px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1" data-testid="text-user-name">
                {user?.firstName} {user?.lastName}
              </h1>
              {user?.location && (
                <p className="text-muted-foreground flex items-center" data-testid="text-user-location">
                  <MapPin className="w-4 h-4 mr-2" />
                  {user.location}
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              {user?.tier && (
                <Badge variant="secondary" className="text-lg px-4 py-2" data-testid="badge-user-tier">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {user.tier} Tier Rider
                </Badge>
              )}
            </div>
          </div>
          
          {/* Core Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-muted/50 rounded-xl p-4 text-center" data-testid="card-stat-mileage">
              <div className="text-3xl font-bold text-secondary stat-number mb-1">
                {user?.weeklyMileage || "0"}
              </div>
              <div className="text-sm text-muted-foreground">Weekly Miles</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center" data-testid="card-stat-rides">
              <div className="text-3xl font-bold text-accent stat-number mb-1">
                {user?.totalRides || "0"}
              </div>
              <div className="text-sm text-muted-foreground">Total Rides</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center" data-testid="card-stat-kudos">
              <div className="text-3xl font-bold text-foreground stat-number mb-1">
                {user?.kudosReceived || "0"}
              </div>
              <div className="text-sm text-muted-foreground">Kudos Received</div>
            </div>
          </div>
          
          {/* Achievements & Badges */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="w-5 h-5 text-accent mr-2" />
              Achievements & Badges
            </h3>
            <div className="flex flex-wrap gap-3">
              {achievements.map((achievement: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center space-x-2 px-4 py-2 bg-accent/10 rounded-lg border border-accent/20"
                  data-testid={`badge-achievement-${index}`}
                >
                  <achievement.icon className={`w-4 h-4 ${achievement.color}`} />
                  <span className="font-medium">{achievement.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Ride Preferences */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Route className="w-5 h-5 text-primary mr-2" />
              Ride Preferences
            </h3>
            <div className="flex flex-wrap gap-2">
              {preferences.map((pref, index) => (
                <Badge key={index} variant="secondary" data-testid={`badge-preference-${index}`}>
                  {pref}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Edit className="w-5 h-5" />
            <span>Edit Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City, State" data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Tell other riders about yourself..."
                        rows={3}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="weeklyMileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Mileage</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          placeholder="100"
                          data-testid="input-weekly-mileage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ftpWatts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FTP (watts)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          placeholder="250"
                          data-testid="input-ftp-watts"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tier">
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A Tier</SelectItem>
                          <SelectItem value="B">B Tier</SelectItem>
                          <SelectItem value="C">C Tier</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
