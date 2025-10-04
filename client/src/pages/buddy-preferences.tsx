import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, MapPin } from "lucide-react";

const buddyPreferencesSchema = z.object({
  paceZone: z.enum(["NoPref", "Z1", "Z2", "Z3", "Z4"]).optional(),
  elevationPref: z.enum(["NoPref", "flat", "rolling", "hilly"]).optional(),
  rideTypePref: z.enum(["any", "road", "gravel", "mtb"]).optional(),
  maxDistanceMi: z.string().optional(),
  socialPref: z.enum(["social", "solo", "flexible"]).optional(),
  activeBuddySearch: z.boolean().default(false),
  visibleInPassivePool: z.boolean().default(false),
});

type BuddyPreferencesFormData = z.infer<typeof buddyPreferencesSchema>;

export default function BuddyPreferences() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/profile', user?.id],
    enabled: !!user?.id,
  });

  const form = useForm<BuddyPreferencesFormData>({
    resolver: zodResolver(buddyPreferencesSchema),
    values: {
      paceZone: (profile as any)?.paceZone || "NoPref",
      elevationPref: (profile as any)?.elevationPref || "NoPref",
      rideTypePref: (profile as any)?.rideTypePref || "any",
      maxDistanceMi: (profile as any)?.maxDistanceMi?.toString() || "",
      socialPref: (profile as any)?.socialPref || "flexible",
      activeBuddySearch: (profile as any)?.activeBuddySearch || false,
      visibleInPassivePool: (profile as any)?.visibleInPassivePool || false,
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: BuddyPreferencesFormData) => {
      const updateData = {
        ...data,
        maxDistanceMi: data.maxDistanceMi ? parseInt(data.maxDistanceMi) : null,
      };
      return await apiRequest("PATCH", "/api/profile", updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile', user?.id] });
      toast({
        title: "Preferences saved",
        description: "Your buddy preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BuddyPreferencesFormData) => {
    updatePreferencesMutation.mutate(data);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Buddy Preferences</h1>
        <p className="text-muted-foreground">
          Set your ride preferences to find compatible training partners
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ride Preferences
              </CardTitle>
              <CardDescription>
                Tell us what kind of rides you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paceZone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pace Zone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-pace-zone">
                          <SelectValue placeholder="Select pace zone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NoPref">No Preference</SelectItem>
                        <SelectItem value="Z1">Recovery (0–59%)</SelectItem>
                        <SelectItem value="Z2">Endurance (60–79%)</SelectItem>
                        <SelectItem value="Z3">Tempo (80–90%)</SelectItem>
                        <SelectItem value="Z4">Threshold + (91%+)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="elevationPref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Elevation Preference</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-elevation-pref">
                          <SelectValue placeholder="Select elevation preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NoPref">No Preference</SelectItem>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="rolling">Rolling</SelectItem>
                        <SelectItem value="hilly">Hilly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rideTypePref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ride Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-ride-type-pref">
                          <SelectValue placeholder="Select ride type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="road">Road</SelectItem>
                        <SelectItem value="gravel">Gravel</SelectItem>
                        <SelectItem value="mtb">MTB</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDistanceMi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Distance (mi)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 50"
                        {...field}
                        data-testid="input-max-distance"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialPref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Preference</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-social-pref">
                          <SelectValue placeholder="Select social preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="social">I'm a social rider</SelectItem>
                        <SelectItem value="solo">I prefer solo rides</SelectItem>
                        <SelectItem value="flexible">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Buddy Search Settings
              </CardTitle>
              <CardDescription>
                Control how you appear in buddy matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="activeBuddySearch"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Looking for a Buddy 👍
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Show me potential training partners to match with
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active-buddy-search"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibleInPassivePool"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Visible to others 👀
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Let other riders see me as a potential match
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-visible-in-passive-pool"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updatePreferencesMutation.isPending}
              data-testid="button-save-preferences"
            >
              {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
