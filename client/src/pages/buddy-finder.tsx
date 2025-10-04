import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Users, MapPin, ThumbsUp, Eye } from "lucide-react";

interface BuddyMatch {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  location: string;
  compatibility: number;
  match_reason: string;
  is_active: boolean;
  pace_zone?: string;
  elevation_pref?: string;
  ride_type_pref?: string;
  social_pref?: string;
}

export default function BuddyFinder() {
  const { user, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = useState({
    pace_zone: "NoPref",
    elevation_pref: "NoPref",
    ride_type: "any",
    max_distance_mi: "",
  });
  const [hasSearched, setHasSearched] = useState(false);

  const buildQueryUrl = () => {
    const queryParams = new URLSearchParams();
    if (filters.pace_zone !== "NoPref") queryParams.set("pace_zone", filters.pace_zone);
    if (filters.elevation_pref !== "NoPref") queryParams.set("elevation_pref", filters.elevation_pref);
    if (filters.ride_type !== "any") queryParams.set("ride_type", filters.ride_type);
    if (filters.max_distance_mi) queryParams.set("max_distance_mi", filters.max_distance_mi);
    
    const queryString = queryParams.toString();
    return queryString ? `/api/buddies/search?${queryString}` : '/api/buddies/search';
  };

  const { data: results, isLoading: searchLoading, refetch } = useQuery<{
    active: BuddyMatch[];
    passive: BuddyMatch[];
    total: number;
  }>({
    queryKey: [buildQueryUrl()],
    enabled: false,
  });

  const handleSearch = () => {
    setHasSearched(true);
    refetch();
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Buddy Finder</h1>
        <p className="text-muted-foreground">
          Best fits are shown first — but all nearby riders are visible. A match is a match.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Set Your Ride Intent
          </CardTitle>
          <CardDescription>
            Filter riders based on what you're looking for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pace-zone">Pace Zone</Label>
              <Select
                value={filters.pace_zone}
                onValueChange={(value) => setFilters({ ...filters, pace_zone: value })}
              >
                <SelectTrigger id="pace-zone" data-testid="select-pace-zone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NoPref">No Pace Preference</SelectItem>
                  <SelectItem value="Z1">Zone 1 – Recovery</SelectItem>
                  <SelectItem value="Z2">Zone 2 – Endurance</SelectItem>
                  <SelectItem value="Z3">Zone 3 – Tempo</SelectItem>
                  <SelectItem value="Z4">Zone 4+ – Threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="elevation-pref">Elevation Preference</Label>
              <Select
                value={filters.elevation_pref}
                onValueChange={(value) => setFilters({ ...filters, elevation_pref: value })}
              >
                <SelectTrigger id="elevation-pref" data-testid="select-elevation-pref">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NoPref">No Elevation Preference</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="rolling">Rolling</SelectItem>
                  <SelectItem value="hilly">Hilly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ride-type">Ride Type</Label>
              <Select
                value={filters.ride_type}
                onValueChange={(value) => setFilters({ ...filters, ride_type: value })}
              >
                <SelectTrigger id="ride-type" data-testid="select-ride-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Ride Type</SelectItem>
                  <SelectItem value="road">Road</SelectItem>
                  <SelectItem value="gravel">Gravel</SelectItem>
                  <SelectItem value="mtb">MTB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max-distance">Max Distance (mi)</Label>
              <Input
                id="max-distance"
                type="number"
                placeholder="e.g. 60"
                value={filters.max_distance_mi}
                onChange={(e) => setFilters({ ...filters, max_distance_mi: e.target.value })}
                data-testid="input-max-distance"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            className="mt-4 w-full md:w-auto"
            disabled={searchLoading}
            data-testid="button-find-buddies"
          >
            {searchLoading ? "Finding..." : "Find Buddies"}
          </Button>
        </CardContent>
      </Card>

      {searchLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading matches...
        </div>
      )}

      {hasSearched && !searchLoading && results && (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold">Looking for a Buddy 👍</h2>
              <Badge variant="secondary">{results.active.length}</Badge>
            </div>
            {results.active.length === 0 ? (
              <p className="text-muted-foreground">No active searchers right now.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.active.map((buddy) => (
                  <Card
                    key={buddy.id}
                    className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
                    data-testid={`active-buddy-${buddy.id}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{buddy.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{buddy.location}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {buddy.compatibility}% match
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {buddy.match_reason}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        {buddy.pace_zone && buddy.pace_zone !== "NoPref" && (
                          <div>Pace: {buddy.pace_zone}</div>
                        )}
                        {buddy.elevation_pref && buddy.elevation_pref !== "NoPref" && (
                          <div>Elevation: {buddy.elevation_pref}</div>
                        )}
                        {buddy.ride_type_pref && buddy.ride_type_pref !== "any" && (
                          <div>Type: {buddy.ride_type_pref}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold">Potential Matches 👀</h2>
              <Badge variant="secondary">{results.passive.length}</Badge>
            </div>
            {results.passive.length === 0 ? (
              <p className="text-muted-foreground">No passive matches yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.passive.map((buddy) => (
                  <Card
                    key={buddy.id}
                    className="border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800"
                    data-testid={`passive-buddy-${buddy.id}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{buddy.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{buddy.location}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {buddy.compatibility}% match
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {buddy.match_reason}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        {buddy.pace_zone && buddy.pace_zone !== "NoPref" && (
                          <div>Pace: {buddy.pace_zone}</div>
                        )}
                        {buddy.elevation_pref && buddy.elevation_pref !== "NoPref" && (
                          <div>Elevation: {buddy.elevation_pref}</div>
                        )}
                        {buddy.ride_type_pref && buddy.ride_type_pref !== "any" && (
                          <div>Type: {buddy.ride_type_pref}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {hasSearched && !searchLoading && !results && (
        <div className="text-center py-8 text-muted-foreground">
          No results. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
